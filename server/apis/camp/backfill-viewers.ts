import { api, z, postgres } from "@superblocksteam/sdk-api";

const APPS_DB = "c6e32cf4-ca66-42ae-aeb3-58c84ffae574";

export default api({
  name: "CampBackfillViewers",
  description: "One-time backfill of existing quiz users into camp_viewers.",

  integrations: {
    db: postgres(APPS_DB),
  },

  input: z.object({}),

  output: z.object({
    inserted: z.number(),
    skipped: z.number(),
  }),

  async run(ctx) {
    // Ensure table exists
    await ctx.integrations.db.execute(
      `CREATE TABLE IF NOT EXISTS camp_viewers (
        id SERIAL PRIMARY KEY,
        user_name TEXT NOT NULL,
        user_email TEXT NOT NULL UNIQUE,
        user_role TEXT NOT NULL,
        manager_name TEXT NOT NULL,
        manager_email TEXT,
        ascent_day1 DATE NOT NULL DEFAULT CURRENT_DATE,
        welcome_seen BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      undefined,
      { label: "Ensure camp_viewers table exists" }
    );

    const backfillUsers = [
      {
        user_name: "Benjamin Singh",
        user_email: "ben.singh@amplitude.com",
        user_role: "Velocity AE",
        manager_name: "Kier Johnson",
        manager_email: "kier.johnson@amplitude.com",
        ascent_day1: "2026-06-22",
      },
      {
        user_name: "Chris English",
        user_email: "chris.english@amplitude.com",
        user_role: "Enterprise AE",
        manager_name: "Rob Bow",
        manager_email: "robert@amplitude.com",
        ascent_day1: "2026-06-23",
      },
      {
        user_name: "Gabi Kassatly",
        user_email: "gabi.kassatly@amplitude.com",
        user_role: "Velocity AE",
        manager_name: "Kier Johnson",
        manager_email: "kier.johnson@amplitude.com",
        ascent_day1: "2026-06-24",
      },
    ];

    let inserted = 0;
    let skipped = 0;

    for (const u of backfillUsers) {
      const result = await ctx.integrations.db.query(
        `INSERT INTO camp_viewers (user_name, user_email, user_role, manager_name, manager_email, ascent_day1, welcome_seen)
         VALUES ($1, $2, $3, $4, $5, $6::date, TRUE)
         ON CONFLICT (user_email) DO NOTHING
         RETURNING id`,
        z.object({ id: z.coerce.number() }),
        [u.user_name, u.user_email, u.user_role, u.manager_name, u.manager_email, u.ascent_day1],
        { label: `Backfill viewer: ${u.user_name}` }
      );

      if (result.length > 0) {
        inserted++;
      } else {
        skipped++;
      }
    }

    return { inserted, skipped };
  },
});
