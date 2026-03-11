import { z } from "zod";
import { eq } from "drizzle-orm";
import { publicProcedure, router } from "../trpc";
import { db } from "@/db";
import { routines, routineEntries } from "@/db/schema";

export const routineRouter = router({
  list: publicProcedure
    .input(z.object({ userId: z.string() }).optional())
    .query(async ({ input }) => {
      if (input?.userId) {
        return db
          .select()
          .from(routines)
          .where(eq(routines.userId, input.userId));
      }
      return db.select().from(routines);
    }),

  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const [routine] = await db
        .select()
        .from(routines)
        .where(eq(routines.id, input.id));

      if (!routine) return null;

      const entries = await db
        .select()
        .from(routineEntries)
        .where(eq(routineEntries.routineId, input.id));

      return { ...routine, entries };
    }),

  create: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        danceId: z.number(),
        name: z.string(),
        description: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const [routine] = await db.insert(routines).values(input).returning();
      return routine;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db
        .delete(routineEntries)
        .where(eq(routineEntries.routineId, input.id));
      await db.delete(routines).where(eq(routines.id, input.id));
      return { success: true };
    }),
});
