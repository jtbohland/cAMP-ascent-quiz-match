import { api, z, postgres } from "@superblocksteam/sdk-api";

const APPS_DB = "c6e32cf4-ca66-42ae-aeb3-58c84ffae574";

export default api({
  name: "CampGetUserAttempts",
  description: "Gets attempt history for a user on a specific quiz",
  integrations: {
    db: postgres(APPS_DB),
  },
  input: z.object({
    quizId: z.string(),
    userEmail: z.string(),
  }),
  output: z.object({
    attempts: z.array(
      z.object({
        id: z.number(),
        attempt_number: z.number(),
        score: z.number(),
        total_questions: z.number(),
        passed: z.boolean(),
        user_role: z.string(),
        created_at: z.string(),
      })
    ),
    incorrectQuestions: z.array(
      z.object({
        question_text: z.string(),
        user_answer: z.string().nullable(),
        correct_answer: z.string(),
      })
    ),
  }),
  async run(ctx, input) {
    // Ensure table exists
    await ctx.integrations.db.query(
      `CREATE TABLE IF NOT EXISTS camp_quiz_attempts (
        id SERIAL PRIMARY KEY,
        quiz_id TEXT NOT NULL,
        user_email TEXT NOT NULL,
        user_name TEXT NOT NULL,
        user_role TEXT NOT NULL,
        attempt_number INTEGER NOT NULL DEFAULT 1,
        score INTEGER NOT NULL,
        total_questions INTEGER NOT NULL DEFAULT 10,
        passed BOOLEAN NOT NULL,
        time_spent_seconds INTEGER,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      z.any(),
      undefined,
      { label: "Ensure camp_quiz_attempts table" }
    );

    const attempts = await ctx.integrations.db.query(
      `SELECT id, attempt_number, score, total_questions, passed, user_role, created_at::text
       FROM camp_quiz_attempts
       WHERE quiz_id = $1 AND user_email = $2
       ORDER BY attempt_number ASC
       LIMIT 10`,
      z.object({
        id: z.number(),
        attempt_number: z.number(),
        score: z.number(),
        total_questions: z.number(),
        passed: z.boolean(),
        user_role: z.string(),
        created_at: z.string(),
      }),
      [input.quizId, input.userEmail],
      { label: "Get user attempts for quiz" }
    );

    // Get incorrect answers across all attempts (deduplicated by question)
    const incorrectQuestions = attempts.length > 0
      ? await ctx.integrations.db.query(
          `SELECT DISTINCT ON (ans.question_text) ans.question_text, ans.user_answer, ans.correct_answer
           FROM camp_quiz_answers ans
           WHERE ans.attempt_id = ANY($1::int[]) AND NOT ans.is_correct
           ORDER BY ans.question_text, ans.attempt_id DESC
           LIMIT 50`,
          z.object({
            question_text: z.string(),
            user_answer: z.string().nullable(),
            correct_answer: z.string(),
          }),
          [attempts.map((a) => a.id)],
          { label: "Get incorrect questions" }
        )
      : [];

    return { attempts, incorrectQuestions };
  },
});
