import { api, z, postgres } from "@superblocksteam/sdk-api";

const APPS_DB = "c6e32cf4-ca66-42ae-aeb3-58c84ffae574";

export default api({
  name: "CampTrackReview",
  description: "Logs when a user clicks Review Quiz to track engagement",
  integrations: {
    db: postgres(APPS_DB),
  },
  input: z.object({
    quizId: z.string(),
    userEmail: z.string(),
    userName: z.string(),
  }),
  output: z.object({
    success: z.boolean(),
  }),
  async run(ctx, input) {
    // Ensure table exists
    await ctx.integrations.db.query(
      `CREATE TABLE IF NOT EXISTS camp_quiz_reviews (
        id SERIAL PRIMARY KEY,
        quiz_id TEXT NOT NULL,
        user_email TEXT NOT NULL,
        user_name TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      z.any(),
      undefined,
      { label: "Ensure camp_quiz_reviews table" }
    );

    await ctx.integrations.db.query(
      `INSERT INTO camp_quiz_reviews (quiz_id, user_email, user_name) VALUES ($1, $2, $3)`,
      z.any(),
      [input.quizId, input.userEmail, input.userName],
      { label: "Log review engagement" }
    );

    return { success: true };
  },
});
