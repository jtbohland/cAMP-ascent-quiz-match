import { api, z, postgres } from "@superblocksteam/sdk-api";

const APPS_DB = "c6e32cf4-ca66-42ae-aeb3-58c84ffae574";

export default api({
  name: "AuditAddSme",
  description: "Adds a new SME assignment to a quiz",
  integrations: {
    apps_db: postgres(APPS_DB),
  },
  input: z.object({
    quizId: z.string(),
    quizTopic: z.string(),
    smeName: z.string(),
    smeTitle: z.string(),
  }),
  output: z.object({ success: z.boolean() }),
  async run(ctx, { quizId, quizTopic, smeName, smeTitle }) {
    await ctx.integrations.apps_db.execute(
      `INSERT INTO camp_quiz_audit_smes (sme_name, sme_title, quiz_id, quiz_topic)
       VALUES ($1, $2, $3, $4)`,
      [smeName, smeTitle, quizId, quizTopic],
      { label: `Add SME: ${smeName} → ${quizTopic}` }
    );
    return { success: true };
  },
});
