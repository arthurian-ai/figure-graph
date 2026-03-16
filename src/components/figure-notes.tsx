"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { X, Edit2 } from "lucide-react";

interface FigureNote {
  id: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

interface FigureNotesProps {
  figureId: number;
  userId: string;
  initialNotes: FigureNote[];
}

export function FigureNotes({ figureId, userId, initialNotes }: FigureNotesProps) {
  const [notes, setNotes] = useState<FigureNote[]>(initialNotes);
  const [newNote, setNewNote] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const utils = trpc.useUtils();

  const createNote = trpc.figure.createNote.useMutation({
    onSuccess: () => {
      utils.figure.getNotes.invalidate({ figureId, userId });
    },
  });

  const updateNote = trpc.figure.updateNote.useMutation({
    onSuccess: () => {
      utils.figure.getNotes.invalidate({ figureId, userId });
    },
  });

  const deleteNote = trpc.figure.deleteNote.useMutation({
    onSuccess: () => {
      utils.figure.getNotes.invalidate({ figureId, userId });
    },
  });

  const handleCreate = async () => {
    if (!newNote.trim()) return;
    setIsSubmitting(true);
    try {
      const note = await createNote.mutateAsync({
        figureId,
        userId,
        content: newNote.trim(),
      });
      setNotes((prev) => [note, ...prev]);
      setNewNote("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editContent.trim()) return;
    setIsSubmitting(true);
    try {
      const note = await updateNote.mutateAsync({
        id,
        userId,
        content: editContent.trim(),
      });
      setNotes((prev) => prev.map((n) => (n.id === id ? note : n)));
      setEditingId(null);
      setEditContent("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    await deleteNote.mutateAsync({ id, userId });
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const startEditing = (note: FigureNote) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditContent("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">My Notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new note */}
        <div className="space-y-2">
          <Textarea
            placeholder="Add a personal note about this figure..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end">
            <Button
              onClick={handleCreate}
              disabled={!newNote.trim() || isSubmitting}
              size="sm"
            >
              {isSubmitting ? "Adding..." : "Add Note"}
            </Button>
          </div>
        </div>

        {/* Notes list */}
        {notes.length > 0 && (
          <div className="space-y-3 pt-4 border-t">
            {notes.map((note) => (
              <div key={note.id} className="group">
                {editingId === note.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={cancelEditing}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleUpdate(note.id)}
                        disabled={!editContent.trim() || isSubmitting}
                      >
                        {isSubmitting ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary/30">
                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(note.updatedAt).toLocaleDateString()}
                        {note.updatedAt !== note.createdAt && " (edited)"}
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => startEditing(note)}
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleDelete(note.id)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
