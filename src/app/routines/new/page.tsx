import { redirect } from "next/navigation";
import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { dances, figures } from "@/db/schema";
import { getCurrentUserId, syncCurrentUser } from "@/lib/auth";
import { RoutineBuilder } from "@/components/routine-builder";

export default async function NewRoutinePage() {
  const userId = await getCurrentUserId();
  
  if (!userId) {
    redirect("/sign-in");
  }

  // Ensure user exists in DB
  await syncCurrentUser();

  const db = getDb();

  // Fetch dances and figures
  const allDances = await db.select().from(dances).orderBy(asc(dances.displayName));
  const allFigures = await db.select().from(figures).orderBy(asc(figures.name));

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Routine</h1>
          <p className="text-muted-foreground mt-2">
            Create a new dance routine by selecting figures in sequence.
          </p>
        </div>

        <RoutineBuilder 
          dances={allDances} 
          figures={allFigures} 
          userId={userId}
        />
      </div>
    </div>
  );
}
