import { api, z, postgres } from "@superblocksteam/sdk-api";

const APPS_DB = "c6e32cf4-ca66-42ae-aeb3-58c84ffae574";

export default api({
  name: "AuditApproveQuestion",
  description: "Marks a question as approved by an SME",
  integrations: {
    apps_db: postgres(APPS_DB),
  },
  input: z.object({
    quizId: z.string(),
    questionIndex: z.number(),
    approvedBy: z.string(),
  }),
  output: z.object({ success: z.boolean() }),
  async run(ctx, { quizId, questionIndex, approvedBy }) {
    await ctx.integrations.apps_db.execute(
      `INSERT INTO camp_quiz_audit_question_approvals (quiz_id, question_id, approved_by)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [quizId, questionIndex, approvedBy],
      { label: `Approve Q${questionIndex} for ${quizId}` }
    );
    return { success: true };
  },
});
