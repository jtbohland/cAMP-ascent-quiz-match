import { api, z, postgres } from "@superblocksteam/sdk-api";

const APPS_DB = "c6e32cf4-ca66-42ae-aeb3-58c84ffae574";

export default api({
  name: "CampSetupTables",
  description: "Creates quiz tracking tables in Apps Database",
  integrations: {
    db: postgres(APPS_DB),
  },
  input: z.object({}),
  output: z.object({ success: z.boolean(), message: z.string() }),
  async run(ctx) {
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
      { label: "Create camp_quiz_attempts table" }
    );

    await ctx.integrations.db.query(
      `CREATE TABLE IF NOT EXISTS camp_quiz_answers (
        id SERIAL PRIMARY KEY,
        attempt_id INTEGER NOT NULL REFERENCES camp_quiz_attempts(id),
        question_id INTEGER NOT NULL,
        question_text TEXT NOT NULL,
        user_answer TEXT,
        correct_answer TEXT NOT NULL,
        is_correct BOOLEAN NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      z.any(),
      undefined,
      { label: "Create camp_quiz_answers table" }
    );

    await ctx.integrations.db.query(
      `CREATE INDEX IF NOT EXISTS idx_camp_attempts_quiz ON camp_quiz_attempts(quiz_id)`,
      z.any(),
      undefined,
      { label: "Create quiz_id index" }
    );

    await ctx.integrations.db.query(
      `CREATE INDEX IF NOT EXISTS idx_camp_attempts_email ON camp_quiz_attempts(user_email)`,
      z.any(),
      undefined,
      { label: "Create email index" }
    );

    await ctx.integrations.db.query(
      `CREATE INDEX IF NOT EXISTS idx_camp_answers_attempt ON camp_quiz_answers(attempt_id)`,
      z.any(),
      undefined,
      { label: "Create attempt_id index" }
    );

    return { success: true, message: "Tables created successfully" };
  },
});
