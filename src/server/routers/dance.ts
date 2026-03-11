import { publicProcedure, router } from "../trpc";
import { db } from "@/db";
import { dances } from "@/db/schema";

export const danceRouter = router({
  list: publicProcedure.query(async () => {
    return db.select().from(dances);
  }),
});
