import { api, z, postgres } from "@superblocksteam/sdk-api";

const APPS_DB = "c6e32cf4-ca66-42ae-aeb3-58c84ffae574";

export default api({
  name: "CampTrackVisit",
  description: "Logs a homepage page load to camp_page_visits",
  integrations: {
    db: postgres(APPS_DB),
  },
  input: z.object({
    userEmail: z.string(),
    userName: z.string(),
  }),
  output: z.object({
    success: z.boolean(),
  }),
  async run(ctx, { userEmail, userName }) {
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

    await ctx.integrations.db.execute(
      `CREATE INDEX IF NOT EXISTS idx_camp_visits_email ON camp_page_visits(user_email)`,
      undefined,
      { label: "Ensure email index" }
    );

    await ctx.integrations.db.execute(
      `INSERT INTO camp_page_visits (user_email, user_name) VALUES ($1, $2)`,
      [userEmail, userName],
      { label: "Log page visit" }
    );

    return { success: true };
  },
});
