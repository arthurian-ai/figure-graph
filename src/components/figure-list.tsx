"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const LEVEL_COLORS: Record<string, string> = {
  student_teacher: "border-bronze text-bronze",
  associate: "border-bronze text-bronze",
  licentiate: "border-silver text-silver",
  fellow: "border-gold text-gold",
};

const LEVEL_LABELS: Record<string, string> = {
  student_teacher: "Student Teacher",
  associate: "Associate",
  licentiate: "Licentiate",
  fellow: "Fellow",
};

type LevelGroup = "bronze" | "silver" | "gold";

const LEVEL_TO_GROUP: Record<string, LevelGroup> = {
  student_teacher: "bronze",
  associate: "bronze",
  licentiate: "silver",
  fellow: "gold",
};

const TOGGLE_CONFIG: { key: LevelGroup; label: string; color: string }[] = [
  { key: "bronze", label: "Bronze", color: "#CD7F32" },
  { key: "silver", label: "Silver", color: "#C0C0C0" },
  { key: "gold", label: "Gold", color: "#FFD700" },
];

interface Figure {
  id: number;
  name: string;
  variantName: string | null;
  level: string;
  figureNumber: number | null;
}

interface FigureListProps {
  figures: Figure[];
  danceSlug: string;
}

export function FigureList({ figures, danceSlug }: FigureListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [enabledLevels, setEnabledLevels] = useState<Record<LevelGroup, boolean>>({
    bronze: true,
    silver: true,
    gold: true,
  });

  const toggleLevel = (group: LevelGroup) => {
    setEnabledLevels((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const filteredFigures = useMemo(() => {
    return figures.filter((figure) => {
      // Filter by level
      const levelGroup = LEVEL_TO_GROUP[figure.level];
      if (!enabledLevels[levelGroup]) return false;

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const nameMatch = figure.name.toLowerCase().includes(query);
        const variantMatch = figure.variantName?.toLowerCase().includes(query);
        const numberMatch = figure.figureNumber?.toString().includes(query);
        return nameMatch || variantMatch || numberMatch;
      }

      return true;
    });
  }, [figures, searchQuery, enabledLevels]);

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="w-full sm:w-72">
          <Input
            type="text"
            placeholder="Search figures..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex gap-2">
          {TOGGLE_CONFIG.map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => toggleLevel(key)}
              className="px-3 py-1.5 rounded-md text-xs font-medium border-2 transition-all"
              style={{
                borderColor: color,
                backgroundColor: enabledLevels[key] ? color : "transparent",
                color: enabledLevels[key] ? "#000" : color,
                opacity: enabledLevels[key] ? 1 : 0.5,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredFigures.length} of {figures.length} figures
      </p>

      {/* Figure list */}
      <div className="space-y-3">
        {filteredFigures.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No figures match your filters
          </div>
        ) : (
          filteredFigures.map((figure) => (
            <Link
              key={figure.id}
              href={`/dances/${danceSlug}/figures/${figure.id}`}
              className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-muted-foreground/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                {figure.figureNumber != null && (
                  <span className="text-muted-foreground text-sm font-mono w-6">
                    {figure.figureNumber}
                  </span>
                )}
                <div>
                  <span className="font-medium">{figure.name}</span>
                  {figure.variantName && (
                    <span className="text-muted-foreground ml-2 text-sm">
                      ({figure.variantName})
                    </span>
                  )}
                </div>
              </div>
              <Badge
                variant="outline"
                className={LEVEL_COLORS[figure.level]}
              >
                {LEVEL_LABELS[figure.level]}
              </Badge>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
