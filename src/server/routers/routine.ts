import { z } from "zod";
import { eq } from "drizzle-orm";
import { publicProcedure, router } from "../trpc";
import { db } from "@/db";
import { routines, routineEntries, figureEdges } from "@/db/schema";

const wallSegmentEnum = z.enum(["long1", "short1", "long2", "short2"]);

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

  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().nullable().optional(),
        isPublished: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const [routine] = await db
        .update(routines)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(routines.id, id))
        .returning();
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

  // Entry management
  setEntries: publicProcedure
    .input(
      z.object({
        routineId: z.number(),
        entries: z.array(
          z.object({
            figureId: z.number(),
            position: z.number(),
            wallSegment: wallSegmentEnum.nullable().optional(),
            notes: z.string().nullable().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      // Delete existing entries
      await db
        .delete(routineEntries)
        .where(eq(routineEntries.routineId, input.routineId));

      // Insert new entries if any
      if (input.entries.length > 0) {
        await db.insert(routineEntries).values(
          input.entries.map((entry) => ({
            routineId: input.routineId,
            ...entry,
          }))
        );
      }

      // Update routine timestamp
      await db
        .update(routines)
        .set({ updatedAt: new Date() })
        .where(eq(routines.id, input.routineId));

      return { success: true };
    }),

  // Edge validation for routine sequences
  validateTransitions: publicProcedure
    .input(
      z.object({
        figureIds: z.array(z.number()),
      })
    )
    .query(async ({ input }) => {
      if (input.figureIds.length < 2) {
        return { valid: true, invalidIndices: [] };
      }

      const invalidIndices: number[] = [];

      // Check each consecutive pair
      for (let i = 0; i < input.figureIds.length - 1; i++) {
        const sourceId = input.figureIds[i];
        const targetId = input.figureIds[i + 1];

        const edge = await db
          .select()
          .from(figureEdges)
          .where(eq(figureEdges.sourceFigureId, sourceId))
          .limit(1);

        const hasValidEdge = edge.some(
          (e) => e.targetFigureId === targetId
        );

        if (!hasValidEdge) {
          invalidIndices.push(i);
        }
      }

      return {
        valid: invalidIndices.length === 0,
        invalidIndices,
      };
    }),
});
