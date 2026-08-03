import { api, z, postgres } from "@superblocksteam/sdk-api";

const APPS_DB = "c6e32cf4-ca66-42ae-aeb3-58c84ffae574";

export default api({
  name: "CampResetUserProgress",
  description: "Deletes all quiz attempts and answers for a given user email.",
  integrations: {
    db: postgres(APPS_DB),
  },
  input: z.object({
    userEmail: z.string(),
  }),
  output: z.object({
    answersDeleted: z.coerce.number(),
    attemptsDeleted: z.coerce.number(),
  }),
  async run(ctx, { userEmail }) {
    // First delete answers (child records)
    const answersResult = await ctx.integrations.db.execute(
      `DELETE FROM camp_quiz_answers WHERE attempt_id IN (SELECT id FROM camp_quiz_attempts WHERE user_email = $1)`,
      [userEmail],
      { label: "Delete user quiz answers" }
    );

    // Then delete attempts (parent records)
    const attemptsResult = await ctx.integrations.db.execute(
      `DELETE FROM camp_quiz_attempts WHERE user_email = $1`,
      [userEmail],
      { label: "Delete user quiz attempts" }
    );

    return {
      answersDeleted: answersResult.rowCount ?? 0,
      attemptsDeleted: attemptsResult.rowCount ?? 0,
    };
  },
});
