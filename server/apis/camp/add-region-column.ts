import { api, z, postgres } from "@superblocksteam/sdk-api";

const APPS_DB = "c6e32cf4-ca66-42ae-aeb3-58c84ffae574";

/**
 * One-time migration: adds region column to camp_viewers and backfills existing learners.
 */
export default api({
  name: "CampAddRegionColumn",
  description: "Adds region column to camp_viewers and backfills existing learners.",

  integrations: {
    db: postgres(APPS_DB),
  },

  input: z.object({}),

  output: z.object({
    success: z.boolean(),
    message: z.string(),
  }),

  async run(ctx) {
    // Add column if it doesn't exist
    await ctx.integrations.db.execute(
      `ALTER TABLE camp_viewers ADD COLUMN IF NOT EXISTS region TEXT NOT NULL DEFAULT 'NAMER'`,
      undefined,
      { label: "Add region column" }
    );

    // Backfill known learners
    await ctx.integrations.db.execute(
      `UPDATE camp_viewers SET region = 'EMEA' WHERE user_name = 'Benjamin Singh'`,
      undefined,
      { label: "Backfill Benjamin Singh → EMEA" }
    );
    await ctx.integrations.db.execute(
      `UPDATE camp_viewers SET region = 'NAMER' WHERE user_name = 'Chris English'`,
      undefined,
      { label: "Backfill Chris English → NAMER" }
    );
    await ctx.integrations.db.execute(
      `UPDATE camp_viewers SET region = 'AAPJ' WHERE user_name = 'Kabir Rai'`,
      undefined,
      { label: "Backfill Kabir Rai → AAPJ" }
    );
    await ctx.integrations.db.execute(
      `UPDATE camp_viewers SET region = 'EMEA' WHERE user_name = 'Gabi Kassatly'`,
      undefined,
      { label: "Backfill Gabi Kassatly → EMEA" }
    );

    return { success: true, message: "Region column added and 4 learners backfilled." };
  },
});
