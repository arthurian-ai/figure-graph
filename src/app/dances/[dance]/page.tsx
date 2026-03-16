import { notFound } from "next/navigation";
import Link from "next/link";
import { eq, asc } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getDb } from "@/db";
import { dances, figures } from "@/db/schema";
import { FigureList } from "@/components/figure-list";

export default async function DancePage({
  params,
}: {
  params: Promise<{ dance: string }>;
}) {
  const { dance: danceSlug } = await params;
  const db = getDb();

  const [dance] = await db
    .select()
    .from(dances)
    .where(eq(dances.name, danceSlug));

  if (!dance) notFound();

  const danceFigures = await db
    .select()
    .from(figures)
    .where(eq(figures.danceId, dance.id))
    .orderBy(asc(figures.figureNumber), asc(figures.name));

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {dance.displayName}
            </h1>
            <p className="text-muted-foreground mt-2">
              {danceFigures.length} figures
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/dances/${danceSlug}/graph`}>View Graph</Link>
          </Button>
        </div>

        <Separator />

        <FigureList figures={danceFigures} danceSlug={danceSlug} />
      </div>
    </div>
  );
}
