import { api, z, postgres } from "@superblocksteam/sdk-api";

const APPS_DB = "c6e32cf4-ca66-42ae-aeb3-58c84ffae574";

export default api({
  name: "AuditRegisterSme",
  description: "Registers an SME by matching their email to the pre-loaded roster",
  integrations: {
    apps_db: postgres(APPS_DB),
  },
  input: z.object({
    smeEmail: z.string(),
    smeName: z.string(),
  }),
  output: z.object({
    success: z.boolean(),
    isNew: z.boolean(),
    assignedQuizzes: z.coerce.number(),
  }),
  async run(ctx, { smeEmail, smeName }) {
    // Check if this email has any SME assignments
    const CountSchema = z.object({ cnt: z.coerce.number() });
    const [{ cnt: alreadyRegistered }] = await ctx.integrations.apps_db.query(
      `SELECT COUNT(*) AS cnt FROM camp_quiz_audit_smes WHERE LOWER(sme_name) = LOWER($1) AND is_registered = TRUE`,
      CountSchema,
      [smeName],
      { label: "Check if SME already registered" }
    );

    // Update all matching SME rows to registered
    const result = await ctx.integrations.apps_db.execute(
      `UPDATE camp_quiz_audit_smes
       SET is_registered = TRUE, registered_at = NOW(), sme_email = LOWER($1)
       WHERE LOWER(sme_name) = LOWER($2) AND is_registered = FALSE`,
      [smeEmail, smeName],
      { label: "Register SME" }
    );

    // Also update already-registered rows with email if missing
    await ctx.integrations.apps_db.execute(
      `UPDATE camp_quiz_audit_smes
       SET sme_email = LOWER($1)
       WHERE LOWER(sme_name) = LOWER($2) AND sme_email IS NULL`,
      [smeEmail, smeName],
      { label: "Backfill SME email" }
    );

    const [{ cnt: totalAssigned }] = await ctx.integrations.apps_db.query(
      `SELECT COUNT(*) AS cnt FROM camp_quiz_audit_smes WHERE LOWER(sme_name) = LOWER($1)`,
      CountSchema,
      [smeName],
      { label: "Count assigned quizzes" }
    );

    return {
      success: totalAssigned > 0,
      isNew: alreadyRegistered === 0 && result.rowCount > 0,
      assignedQuizzes: totalAssigned,
    };
  },
});
