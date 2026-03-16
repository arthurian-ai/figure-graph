import Link from "next/link";
import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDb } from "@/db";
import { routines, dances } from "@/db/schema";
import { syncCurrentUser, getCurrentUserId } from "@/lib/auth";

export default async function RoutinesPage() {
  const userId = await getCurrentUserId();
  
  if (!userId) {
    redirect("/sign-in");
  }

  // Ensure user exists in our database
  await syncCurrentUser();

  const db = getDb();

  // Fetch user's routines with dance info
  const userRoutines = await db
    .select({
      id: routines.id,
      name: routines.name,
      description: routines.description,
      isPublished: routines.isPublished,
      createdAt: routines.createdAt,
      danceName: dances.displayName,
    })
    .from(routines)
    .innerJoin(dances, eq(routines.danceId, dances.id))
    .where(eq(routines.userId, userId))
    .orderBy(desc(routines.createdAt));

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Routines</h1>
            <p className="text-muted-foreground mt-2">
              Build and manage your dance routines.
            </p>
          </div>
          <Button asChild>
            <Link href="/routines/new">New Routine</Link>
          </Button>
        </div>

        {userRoutines.length === 0 ? (
          <div className="flex items-center justify-center h-64 rounded-lg border border-dashed border-border">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">No routines yet.</p>
              <p className="text-sm text-muted-foreground">
                Create your first routine to get started.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {userRoutines.map((routine) => (
              <Link key={routine.id} href={`/routines/${routine.id}`}>
                <Card className="hover:border-muted-foreground/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{routine.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {routine.danceName}
                          {routine.isPublished && (
                            <span className="ml-2 text-xs text-muted-foreground">(Public)</span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    {routine.description && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {routine.description}
                      </p>
                    )}
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
