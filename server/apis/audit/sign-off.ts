import { api, z, postgres } from "@superblocksteam/sdk-api";

const APPS_DB = "c6e32cf4-ca66-42ae-aeb3-58c84ffae574";

export default api({
  name: "AuditSignOff",
  description: "Records an SME sign-off on a quiz audit",
  integrations: {
    apps_db: postgres(APPS_DB),
  },
  input: z.object({
    quizId: z.string(),
    smeName: z.string(),
    smeEmail: z.string(),
    notes: z.string().nullable(),
  }),
  output: z.object({ success: z.boolean() }),
  async run(ctx, { quizId, smeName, smeEmail, notes }) {
    await ctx.integrations.apps_db.execute(
      `INSERT INTO camp_quiz_audit_signoffs (quiz_id, sme_name, sme_email, notes)
       VALUES ($1, $2, $3, $4)`,
      [quizId, smeName, smeEmail, notes],
      { label: `Sign off: ${smeName} on ${quizId}` }
    );
    return { success: true };
  },
});
