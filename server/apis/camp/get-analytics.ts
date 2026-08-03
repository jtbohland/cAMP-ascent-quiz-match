import { api, z, postgres } from "@superblocksteam/sdk-api";

const APPS_DB = "c6e32cf4-ca66-42ae-aeb3-58c84ffae574";

// Admin emails excluded from analytics — these users still have full app access
// but their quiz data won't appear in the dashboard metrics
const ADMIN_EMAILS = ["jt.bohland@amplitude.com"];

export default api({
  name: "CampGetAnalytics",
  description: "Fetches quiz analytics data for the dashboard",
  integrations: {
    db: postgres(APPS_DB),
  },
  input: z.object({
    quizId: z.string().nullable(),
    role: z.string().nullable(),
    dateFrom: z.string().nullable(),
    dateTo: z.string().nullable(),
  }),
  output: z.object({
    summary: z.object({
      totalAttempts: z.number(),
      uniqueUsers: z.number(),
      overallPassRate: z.number(),
      averageScore: z.number(),
    }),
    byQuiz: z.array(
      z.object({
        quiz_id: z.string(),
        attempts: z.number(),
        avg_score: z.number(),
        pass_rate: z.number(),
        unique_users: z.number(),
        review_count: z.number(),
      })
    ),
    byRole: z.array(
      z.object({
        user_role: z.string(),
        attempts: z.number(),
        avg_score: z.number(),
        pass_rate: z.number(),
      })
    ),
    mostMissed: z.array(
      z.object({
        question_text: z.string(),
        quiz_id: z.string(),
        times_missed: z.number(),
        times_asked: z.number(),
        miss_rate: z.number(),
      })
    ),
    recentAttempts: z.array(
      z.object({
        user_name: z.string(),
        user_email: z.string(),
        user_role: z.string(),
        quiz_id: z.string(),
        score: z.number(),
        total_questions: z.number(),
        passed: z.boolean(),
        attempt_number: z.number(),
        created_at: z.string(),
      })
    ),
  }),
  async run(ctx, input) {
    // Ensure tables exist
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
      { label: "Ensure camp_quiz_answers table" }
    );

    // Build WHERE clause based on filters
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    // Always exclude admin emails from analytics
    conditions.push(`a.user_email != ALL($${paramIdx}::text[])`);
    params.push(ADMIN_EMAILS);
    paramIdx++;

    if (input.quizId) {
      conditions.push(`a.quiz_id = $${paramIdx}`);
      params.push(input.quizId);
      paramIdx++;
    }
    if (input.role) {
      conditions.push(`a.user_role = $${paramIdx}`);
      params.push(input.role);
      paramIdx++;
    }
    if (input.dateFrom) {
      conditions.push(`a.created_at >= $${paramIdx}::timestamptz`);
      params.push(input.dateFrom);
      paramIdx++;
    }
    if (input.dateTo) {
      conditions.push(`a.created_at <= $${paramIdx}::timestamptz`);
      params.push(input.dateTo);
      paramIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Summary stats
    const summaryResult = await ctx.integrations.db.query(
      `SELECT
        COUNT(*)::int AS total_attempts,
        COUNT(DISTINCT a.user_email)::int AS unique_users,
        ROUND((AVG(CASE WHEN a.passed THEN 1 ELSE 0 END) * 100)::numeric, 1)::float AS pass_rate,
        ROUND((AVG(a.score::float / a.total_questions * 100))::numeric, 1)::float AS avg_score
       FROM camp_quiz_attempts a
       ${whereClause}`,
      z.object({
        total_attempts: z.number(),
        unique_users: z.number(),
        pass_rate: z.number().nullable(),
        avg_score: z.number().nullable(),
      }),
      params,
      { label: "Get summary stats" }
    );

    const summary = {
      totalAttempts: summaryResult[0]?.total_attempts ?? 0,
      uniqueUsers: summaryResult[0]?.unique_users ?? 0,
      overallPassRate: summaryResult[0]?.pass_rate ?? 0,
      averageScore: summaryResult[0]?.avg_score ?? 0,
    };

    // By quiz breakdown
    const byQuiz = await ctx.integrations.db.query(
      `SELECT
        a.quiz_id,
        COUNT(*)::int AS attempts,
        ROUND((AVG(a.score::float / a.total_questions * 100))::numeric, 1)::float AS avg_score,
        ROUND((AVG(CASE WHEN a.passed THEN 1 ELSE 0 END) * 100)::numeric, 1)::float AS pass_rate,
        COUNT(DISTINCT a.user_email)::int AS unique_users,
        COALESCE((SELECT COUNT(*)::int FROM camp_quiz_reviews r WHERE r.quiz_id = a.quiz_id), 0) AS review_count
       FROM camp_quiz_attempts a
       ${whereClause}
       GROUP BY a.quiz_id
       ORDER BY a.quiz_id
       LIMIT 50`,
      z.object({
        quiz_id: z.string(),
        attempts: z.number(),
        avg_score: z.number(),
        pass_rate: z.number(),
        unique_users: z.number(),
        review_count: z.number(),
      }),
      params,
      { label: "Get stats by quiz" }
    );

    // By role breakdown
    const byRole = await ctx.integrations.db.query(
      `SELECT
        a.user_role,
        COUNT(*)::int AS attempts,
        ROUND((AVG(a.score::float / a.total_questions * 100))::numeric, 1)::float AS avg_score,
        ROUND((AVG(CASE WHEN a.passed THEN 1 ELSE 0 END) * 100)::numeric, 1)::float AS pass_rate
       FROM camp_quiz_attempts a
       ${whereClause}
       GROUP BY a.user_role
       ORDER BY a.user_role
       LIMIT 50`,
      z.object({
        user_role: z.string(),
        attempts: z.number(),
        avg_score: z.number(),
        pass_rate: z.number(),
      }),
      params,
      { label: "Get stats by role" }
    );

    // Most missed questions
    const answerConditions: string[] = [];
    const answerParams: any[] = [];
    let ansParamIdx = 1;

    // Exclude admin emails
    answerConditions.push(`a.user_email != ALL($${ansParamIdx}::text[])`);
    answerParams.push(ADMIN_EMAILS);
    ansParamIdx++;

    if (input.quizId) {
      answerConditions.push(`a.quiz_id = $${ansParamIdx}`);
      answerParams.push(input.quizId);
      ansParamIdx++;
    }
    if (input.role) {
      answerConditions.push(`a.user_role = $${ansParamIdx}`);
      answerParams.push(input.role);
      ansParamIdx++;
    }
    if (input.dateFrom) {
      answerConditions.push(`a.created_at >= $${ansParamIdx}::timestamptz`);
      answerParams.push(input.dateFrom);
      ansParamIdx++;
    }
    if (input.dateTo) {
      answerConditions.push(`a.created_at <= $${ansParamIdx}::timestamptz`);
      answerParams.push(input.dateTo);
      ansParamIdx++;
    }

    const ansWhereClause = answerConditions.length > 0 ? `WHERE ${answerConditions.join(" AND ")}` : "";

    const mostMissed = await ctx.integrations.db.query(
      `SELECT
        ans.question_text,
        a.quiz_id,
        SUM(CASE WHEN NOT ans.is_correct THEN 1 ELSE 0 END)::int AS times_missed,
        COUNT(*)::int AS times_asked,
        ROUND((SUM(CASE WHEN NOT ans.is_correct THEN 1 ELSE 0 END)::float / COUNT(*) * 100)::numeric, 1)::float AS miss_rate
       FROM camp_quiz_answers ans
       JOIN camp_quiz_attempts a ON ans.attempt_id = a.id
       ${ansWhereClause}
       GROUP BY ans.question_text, a.quiz_id
       HAVING COUNT(*) >= 2 AND ROUND((SUM(CASE WHEN NOT ans.is_correct THEN 1 ELSE 0 END)::float / COUNT(*) * 100)::numeric, 1) >= 35
       ORDER BY miss_rate DESC
       LIMIT 10`,
      z.object({
        question_text: z.string(),
        quiz_id: z.string(),
        times_missed: z.number(),
        times_asked: z.number(),
        miss_rate: z.number(),
      }),
      answerParams,
      { label: "Get most missed questions" }
    );

    // Recent attempts
    const recentAttempts = await ctx.integrations.db.query(
      `SELECT a.user_name, a.user_email, a.user_role, a.quiz_id, a.score, a.total_questions, a.passed, a.attempt_number, a.created_at::text
       FROM camp_quiz_attempts a
       ${whereClause}
       ORDER BY a.created_at DESC
       LIMIT 20`,
      z.object({
        user_name: z.string(),
        user_email: z.string(),
        user_role: z.string(),
        quiz_id: z.string(),
        score: z.number(),
        total_questions: z.number(),
        passed: z.boolean(),
        attempt_number: z.number(),
        created_at: z.string(),
      }),
      params,
      { label: "Get recent attempts" }
    );

    return { summary, byQuiz, byRole, mostMissed, recentAttempts };
  },
});
