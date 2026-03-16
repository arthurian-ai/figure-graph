import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";

/**
 * Ensures the current Clerk user exists in our database.
 * Should be called from protected server components or API routes.
 */
export async function syncCurrentUser() {
  const { userId } = await auth();
  
  if (!userId) {
    return null;
  }

  const db = getDb();

  // Check if user exists
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (existingUser.length > 0) {
    return existingUser[0];
  }

  // Create user if not exists
  const [newUser] = await db
    .insert(users)
    .values({
      id: userId,
    })
    .returning();

  return newUser;
}

/**
 * Gets the current user ID from Clerk auth.
 * Returns null if not authenticated.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}
