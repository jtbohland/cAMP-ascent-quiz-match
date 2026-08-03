import { api, z, postgres } from "@superblocksteam/sdk-api";

const APPS_DB = "c6e32cf4-ca66-42ae-aeb3-58c84ffae574";

export default api({
  name: "CampGetVisitStats",
  description: "Returns total visits and unique visitor counts",
  integrations: {
    db: postgres(APPS_DB),
  },
  input: z.object({}),
  output: z.object({
    totalVisits: z.number(),
    uniqueVisitors: z.number(),
  }),
  async run(ctx) {
    // Ensure table exists (safe no-op if already created)
    await ctx.integrations.db.execute(
      `CREATE TABLE IF NOT EXISTS camp_page_visits (
        id SERIAL PRIMARY KEY,
        user_email TEXT,
        user_name TEXT,
        visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      undefined,
      { label: "Ensure camp_page_visits table exists" }
    );

    const rows = await ctx.integrations.db.query(
      `SELECT COUNT(*)::int AS total_visits, COUNT(DISTINCT user_email)::int AS unique_visitors FROM camp_page_visits`,
      z.object({
        total_visits: z.coerce.number(),
        unique_visitors: z.coerce.number(),
      }),
      undefined,
      { label: "Get visit stats" }
    );

    return {
      totalVisits: rows[0]?.total_visits ?? 0,
      uniqueVisitors: rows[0]?.unique_visitors ?? 0,
    };
  },
});
