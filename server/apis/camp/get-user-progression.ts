import { api, z, postgres } from "@superblocksteam/sdk-api";

const APPS_DB = "c6e32cf4-ca66-42ae-aeb3-58c84ffae574";

export default api({
  name: "CampGetUserProgression",
  description: "Gets quizzes a user has completed (passed OR used all attempts) for sequential unlock",
  integrations: {
    db: postgres(APPS_DB),
  },
  input: z.object({
    userEmail: z.string(),
  }),
  output: z.object({
    passedQuizIds: z.array(z.string()),
    completedQuizIds: z.array(z.string()),
    retakeQuizIds: z.array(z.string()),
  }),
  async run(ctx, input) {
    // Quizzes the user passed
    const passedRows = await ctx.integrations.db.query(
      `SELECT DISTINCT quiz_id
       FROM camp_quiz_attempts
       WHERE user_email = $1 AND passed = true
       LIMIT 50`,
      z.object({ quiz_id: z.string() }),
      [input.userEmail],
      { label: "Get passed quizzes" }
    );

    // Quizzes where user has completed at least 2 attempts OR passed (unlocks next quiz)
    const completedRows = await ctx.integrations.db.query(
      `SELECT quiz_id
       FROM camp_quiz_attempts
       WHERE user_email = $1
       GROUP BY quiz_id
       HAVING MAX(attempt_number) >= 2 OR bool_or(passed)
       LIMIT 50`,
      z.object({ quiz_id: z.string() }),
      [input.userEmail],
      { label: "Get completed quizzes (2+ attempts OR passed = next quiz unlocked)" }
    );

    // Quizzes where user failed first 2 attempts but hasn't used 4 yet (eligible for retake)
    const retakeRows = await ctx.integrations.db.query(
      `SELECT quiz_id
       FROM camp_quiz_attempts
       WHERE user_email = $1
       GROUP BY quiz_id
       HAVING MAX(attempt_number) >= 2 AND MAX(attempt_number) < 4 AND NOT bool_or(passed)
       LIMIT 50`,
      z.object({ quiz_id: z.string() }),
      [input.userEmail],
      { label: "Get retake-eligible quizzes (2 attempts used, not passed)" }
    );

    return {
      passedQuizIds: passedRows.map((r) => r.quiz_id),
      completedQuizIds: completedRows.map((r) => r.quiz_id),
      retakeQuizIds: retakeRows.map((r) => r.quiz_id),
    };
  },
});
