import { api, z, postgres } from "@superblocksteam/sdk-api";

const APPS_DB = "c6e32cf4-ca66-42ae-aeb3-58c84ffae574";

export default api({
  name: "AuditReviewGear",
  description: "Marks a cAMP Gear item as reviewed",
  integrations: {
    apps_db: postgres(APPS_DB),
  },
  input: z.object({
    quizId: z.string(),
    gearLabel: z.string(),
    reviewedBy: z.string(),
  }),
  output: z.object({ success: z.boolean() }),
  async run(ctx, { quizId, gearLabel, reviewedBy }) {
    await ctx.integrations.apps_db.execute(
      `INSERT INTO camp_quiz_audit_gear_reviews (quiz_id, gear_label, reviewed_by)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [quizId, gearLabel, reviewedBy],
      { label: `Review gear: ${gearLabel}` }
    );
    return { success: true };
  },
});
