import { z } from "zod";
import { eq, and, desc, or } from "drizzle-orm";
import { publicProcedure, router } from "../trpc";
import { db } from "@/db";
import { figures, figureEdges, figureNotes } from "@/db/schema";

export const figureRouter = router({
  list: publicProcedure
    .input(z.object({ danceId: z.number() }).optional())
    .query(async ({ input }) => {
      if (input?.danceId) {
        return db
          .select()
          .from(figures)
          .where(eq(figures.danceId, input.danceId));
      }
      return db.select().from(figures);
    }),

  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const [figure] = await db
        .select()
        .from(figures)
        .where(eq(figures.id, input.id));
      return figure ?? null;
    }),

  neighbors: publicProcedure
    .input(z.object({ figureId: z.number() }))
    .query(async ({ input }) => {
      const edges = await db
        .select()
        .from(figureEdges)
        .where(
          or(
            eq(figureEdges.sourceFigureId, input.figureId),
            eq(figureEdges.targetFigureId, input.figureId)
          )
        );

      const precedes = edges.filter(
        (e) => e.targetFigureId === input.figureId
      );
      const follows = edges.filter(
        (e) => e.sourceFigureId === input.figureId
      );

      return { precedes, follows };
    }),

  // User notes for figures
  getNotes: publicProcedure
    .input(z.object({ figureId: z.number(), userId: z.string() }))
    .query(async ({ input }) => {
      const notes = await db
        .select()
        .from(figureNotes)
        .where(
          and(
            eq(figureNotes.figureId, input.figureId),
            eq(figureNotes.userId, input.userId)
          )
        )
        .orderBy(desc(figureNotes.createdAt));
      return notes;
    }),

  createNote: publicProcedure
    .input(
      z.object({
        figureId: z.number(),
        userId: z.string(),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const [note] = await db
        .insert(figureNotes)
        .values({
          figureId: input.figureId,
          userId: input.userId,
          content: input.content,
        })
        .returning();
      return note;
    }),

  updateNote: publicProcedure
    .input(
      z.object({
        id: z.number(),
        userId: z.string(),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const { id, userId, content } = input;
      const [note] = await db
        .update(figureNotes)
        .set({ content, updatedAt: new Date() })
        .where(and(eq(figureNotes.id, id), eq(figureNotes.userId, userId)))
        .returning();
      return note;
    }),

  deleteNote: publicProcedure
    .input(z.object({ id: z.number(), userId: z.string() }))
    .mutation(async ({ input }) => {
      await db
        .delete(figureNotes)
        .where(
          and(
            eq(figureNotes.id, input.id),
            eq(figureNotes.userId, input.userId)
          )
        );
      return { success: true };
    }),
});
