import { api, z, postgres } from "@superblocksteam/sdk-api";

const APPS_DB = "c6e32cf4-ca66-42ae-aeb3-58c84ffae574";

const SnapshotQuestionSchema = z.object({
  id: z.number(),
  type: z.string(),
  lo: z.string(),
  text: z.string(),
  options: z.array(z.string()).optional(),
  correct: z.union([z.number(), z.array(z.string())]),
  explanation: z.string(),
  placeholder: z.string().optional(),
  pairs: z.array(z.object({ term: z.string(), match: z.string() })).optional(),
  resource: z.object({ label: z.string(), url: z.string() }),
});

export default api({
  name: "CampGetQuizSnapshot",
  description: "Retrieves the question snapshot for a specific quiz attempt",
  integrations: {
    db: postgres(APPS_DB),
  },
  input: z.object({
    attemptId: z.number(),
  }),
  output: z.object({
    questions: z.array(SnapshotQuestionSchema).nullable(),
  }),
  async run(ctx, { attemptId }) {
    // Ensure table exists
    await ctx.integrations.db.execute(
      `CREATE TABLE IF NOT EXISTS camp_quiz_snapshots (
        id SERIAL PRIMARY KEY,
        attempt_id INTEGER NOT NULL UNIQUE REFERENCES camp_quiz_attempts(id),
        quiz_id TEXT NOT NULL,
        questions_json JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      undefined,
      { label: "Ensure camp_quiz_snapshots table" }
    );

    const rows = await ctx.integrations.db.query(
      `SELECT questions_json FROM camp_quiz_snapshots WHERE attempt_id = $1 LIMIT 1`,
      z.object({ questions_json: z.any() }),
      [attemptId],
      { label: "Get snapshot for attempt" }
    );

    if (rows.length === 0) {
      return { questions: null };
    }

    return { questions: rows[0].questions_json as z.infer<typeof SnapshotQuestionSchema>[] };
  },
});
