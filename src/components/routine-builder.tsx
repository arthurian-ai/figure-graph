"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, AlertTriangle, X, GripVertical, Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface Dance { id: number; name: string; displayName: string; }
interface Figure { id: number; name: string; variantName: string | null; level: string; figureNumber: number | null; danceId: number; }
interface RoutineEntry { figureId: number; position: number; wallSegment?: "long1" | "short1" | "long2" | "short2" | null; notes?: string | null; }
interface RoutineBuilderProps { dances: Dance[]; figures: Figure[]; existingRoutine?: { id: number; name: string; description: string | null; danceId: number; entries: RoutineEntry[]; } | null; userId: string; }

const LEVEL_COLORS: Record<string, string> = {
  student_teacher: "bg-bronze/20 text-bronze border-bronze/50",
  associate: "bg-bronze/20 text-bronze border-bronze/50",
  licentiate: "bg-silver/20 text-silver border-silver/50",
  fellow: "bg-gold/20 text-gold border-gold/50",
};
const WALL_SEGMENTS = [
  { value: "long1", label: "Long Wall 1" },
  { value: "short1", label: "Short Wall 1" },
  { value: "long2", label: "Long Wall 2" },
  { value: "short2", label: "Short Wall 2" },
];

function SortableEntryItem({ entry, figure, index, isValid, onRemove, onWallSegmentChange, onNotesChange }: {
  entry: RoutineEntry; figure: Figure; index: number; isValid: boolean;
  onRemove: () => void; onWallSegmentChange: (value: "long1" | "short1" | "long2" | "short2" | null) => void; onNotesChange: (value: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: entry.figureId.toString() + "-" + index });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <Card ref={setNodeRef} style={style} className="mb-2">
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-secondary rounded">
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{figure.name}</span>
              {figure.variantName && <span className="text-sm text-muted-foreground truncate">({figure.variantName})</span>}
              <Badge variant="outline" className={LEVEL_COLORS[figure.level]}>{figure.level.replace("_", " ")}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {index > 0 && (
              <div title={isValid ? "Valid transition" : "No direct edge"}>
                {isValid ? <Check className="w-4 h-4 text-green-500" /> : <AlertTriangle className="w-4 h-4 text-yellow-500" />}
              </div>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRemove}><X className="w-4 h-4" /></Button>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Select value={entry.wallSegment || "none"} onValueChange={(v) => onWallSegmentChange(v === "none" ? null : v as "long1" | "short1" | "long2" | "short2")}>
            <SelectTrigger className="w-32 h-7 text-xs"><SelectValue placeholder="Wall" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No wall</SelectItem>
              {WALL_SEGMENTS.map((seg) => <SelectItem key={seg.value} value={seg.value}>{seg.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="text" placeholder="Notes..." value={entry.notes || ""} onChange={(e) => onNotesChange(e.target.value)} className="flex-1 h-7 text-xs" />
        </div>
      </CardContent>
    </Card>
  );
}

export function RoutineBuilder({ dances, figures, existingRoutine, userId }: RoutineBuilderProps) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [selectedDanceId, setSelectedDanceId] = useState<string>(existingRoutine?.danceId.toString() || "");
  const [routineName, setRoutineName] = useState(existingRoutine?.name || "");
  const [routineDescription, setRoutineDescription] = useState(existingRoutine?.description || "");
  const [entries, setEntries] = useState<RoutineEntry[]>(existingRoutine?.entries || []);
  const [figureSearch, setFigureSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const createRoutine = trpc.routine.create.useMutation({ onSuccess: () => utils.routine.list.invalidate() });
  const updateRoutine = trpc.routine.update.useMutation({ onSuccess: () => utils.routine.list.invalidate() });
  const setEntriesMutation = trpc.routine.setEntries.useMutation();

  const selectedDanceFigures = useMemo(() => selectedDanceId ? figures.filter((f) => f.danceId === parseInt(selectedDanceId)) : [], [figures, selectedDanceId]);
  const filteredFigures = useMemo(() => {
    if (!figureSearch.trim()) return selectedDanceFigures;
    const query = figureSearch.toLowerCase();
    return selectedDanceFigures.filter((f) => f.name.toLowerCase().includes(query) || f.variantName?.toLowerCase().includes(query) || f.figureNumber?.toString().includes(query));
  }, [selectedDanceFigures, figureSearch]);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setEntries((items) => {
        const oldIndex = items.findIndex((_, idx) => items[idx].figureId.toString() + "-" + idx === active.id);
        const newIndex = items.findIndex((_, idx) => items[idx].figureId.toString() + "-" + idx === over.id);
        return arrayMove(items, oldIndex, newIndex).map((item, idx) => ({ ...item, position: idx }));
      });
    }
  };

  const addFigure = (figureId: number) => setEntries((prev) => [...prev, { figureId, position: prev.length, wallSegment: null, notes: null }]);
  const removeEntry = (index: number) => setEntries((prev) => prev.filter((_, i) => i !== index).map((entry, idx) => ({ ...entry, position: idx })));
  const updateEntry = (index: number, updates: Partial<RoutineEntry>) => setEntries((prev) => prev.map((entry, i) => (i === index ? { ...entry, ...updates } : entry)));

  const handleSave = async () => {
    if (!routineName.trim() || !selectedDanceId) return;
    setIsSaving(true);
    try {
      let routineId = existingRoutine?.id;
      if (!routineId) {
        const newRoutine = await createRoutine.mutateAsync({ userId, danceId: parseInt(selectedDanceId), name: routineName, description: routineDescription || null });
        routineId = newRoutine.id;
      } else {
        await updateRoutine.mutateAsync({ id: routineId, name: routineName, description: routineDescription || null });
      }
      await setEntriesMutation.mutateAsync({ routineId, entries });
      router.push(`/routines/${routineId}`);
    } finally { setIsSaving(false); }
  };

  const isEditing = !!existingRoutine;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="dance">Dance</Label>
            <Select value={selectedDanceId} onValueChange={setSelectedDanceId} disabled={isEditing}>
              <SelectTrigger id="dance"><SelectValue placeholder="Select a dance" /></SelectTrigger>
              <SelectContent>
                {dances.map((dance) => <SelectItem key={dance.id} value={dance.id.toString()}>{dance.displayName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Routine Name</Label>
            <Input id="name" value={routineName} onChange={(e) => setRoutineName(e.target.value)} placeholder="e.g., Competition Waltz" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea id="description" value={routineDescription} onChange={(e) => setRoutineDescription(e.target.value)} placeholder="Brief description..." rows={2} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-4">
          <div className="space-y-2">
            <Label>Figures</Label>
            <Input type="text" placeholder="Search figures..." value={figureSearch} onChange={(e) => setFigureSearch(e.target.value)} disabled={!selectedDanceId} />
          </div>
          <div className="border rounded-lg max-h-[500px] overflow-y-auto">
            {!selectedDanceId ? (
              <div className="p-4 text-center text-muted-foreground text-sm">Select a dance to see available figures</div>
            ) : filteredFigures.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">No figures found</div>
            ) : (
              <div className="divide-y">
                {filteredFigures.map((figure) => (
                  <div key={figure.id} className="p-3 flex items-center justify-between hover:bg-secondary/50">
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{figure.name}</div>
                      {figure.variantName && <div className="text-xs text-muted-foreground">({figure.variantName})</div>}
                    </div>
                    <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => addFigure(figure.id)}><Plus className="w-4 h-4" /></Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <Label>Routine Sequence ({entries.length} figures)</Label>
            {entries.length > 0 && <Button variant="outline" size="sm" onClick={() => setEntries([])}>Clear All</Button>}
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={entries.map((e, i) => e.figureId.toString() + "-" + i)} strategy={verticalListSortingStrategy}>
              <div className="min-h-[200px]">
                {entries.length === 0 ? (
                  <div className="flex items-center justify-center h-64 border-2 border-dashed border-border rounded-lg">
                    <p className="text-muted-foreground">Add figures to build your routine</p>
                  </div>
                ) : (
                  entries.map((entry, index) => {
                    const figure = figures.find((f) => f.id === entry.figureId);
                    if (!figure) return null;
                    return (
                      <SortableEntryItem key={entry.figureId + "-" + index} entry={entry} figure={figure} index={index} isValid={true}
                        onRemove={() => removeEntry(index)} onWallSegmentChange={(v) => updateEntry(index, { wallSegment: v })} onNotesChange={(v) => updateEntry(index, { notes: v })} />
                    );
                  })
                )}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => router.push("/routines")}>Cancel</Button>
        <Button onClick={handleSave} disabled={!routineName.trim() || !selectedDanceId || isSaving}>{isSaving ? "Saving..." : isEditing ? "Save Changes" : "Create Routine"}</Button>
      </div>
    </div>
  );
}
