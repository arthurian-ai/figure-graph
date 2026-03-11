import { router } from "../trpc";
import { danceRouter } from "./dance";
import { figureRouter } from "./figure";
import { routineRouter } from "./routine";

export const appRouter = router({
  dance: danceRouter,
  figure: figureRouter,
  routine: routineRouter,
});

export type AppRouter = typeof appRouter;
