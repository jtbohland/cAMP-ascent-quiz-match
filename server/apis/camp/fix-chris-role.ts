import { api, z, postgres } from "@superblocksteam/sdk-api";

const APPS_DB = "c6e32cf4-ca66-42ae-aeb3-58c84ffae574";

/**
 * One-time fix: update Chris English's role from "Enterprise AE" to "Majors AE".
 */
export default api({
  name: "CampFixChrisRole",
  description: "Updates Chris English's role to Majors AE.",

  integrations: {
    db: postgres(APPS_DB),
  },

  input: z.object({}),

  output: z.object({
    updated: z.number(),
  }),

  async run(ctx) {
    const result = await ctx.integrations.db.execute(
      `UPDATE camp_viewers SET user_role = 'Majors AE' WHERE user_email = 'chris.english@amplitude.com'`,
      undefined,
      { label: "Fix Chris English role to Majors AE" }
    );
    ctx.log.info("Updated Chris English role", { rowCount: result.rowCount });
    return { updated: result.rowCount };
  },
});
