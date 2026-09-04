import { api, z, postgres } from "@superblocksteam/sdk-api";

const APPS_DB = "c6e32cf4-ca66-42ae-aeb3-58c84ffae574";

const AuditTopicSchema = z.object({
  quiz_id: z.string(),
  quiz_topic: z.string(),
  day: z.string().nullable(),
  title: z.string().nullable(),
  week: z.string().nullable(),
  path_tag: z.string().nullable(),
  smes: z.string(),
  sme_count: z.coerce.number(),
  registered_count: z.coerce.number(),
  question_count: z.coerce.number(),
  approved_count: z.coerce.number(),
  gear_total: z.coerce.number(),
  gear_reviewed: z.coerce.number(),
  signoff_count: z.coerce.number(),
  last_activity: z.string().nullable(),
});

export default api({
  name: "AuditGetDashboard",
  description: "Fetches audit dashboard data with progress for all quiz topics",
  integrations: {
    apps_db: postgres(APPS_DB),
  },
  input: z.object({}),
  output: z.object({ topics: z.array(AuditTopicSchema) }),
  async run(ctx) {
    const topics = await ctx.integrations.apps_db.query(
      `WITH sme_agg AS (
        SELECT quiz_id, quiz_topic,
          STRING_AGG(sme_name || ' · ' || sme_title, '\n' ORDER BY sme_name) AS smes,
          COUNT(*) AS sme_count,
          COUNT(*) FILTER (WHERE is_registered) AS registered_count
        FROM camp_quiz_audit_smes
        GROUP BY quiz_id, quiz_topic
      ),
      q_counts AS (
        SELECT quiz_id, COUNT(*) AS question_count
        FROM camp_quiz_questions_db
        GROUP BY quiz_id
      ),
      approvals AS (
        SELECT quiz_id, COUNT(DISTINCT question_id) AS approved_count
        FROM camp_quiz_audit_question_approvals
        GROUP BY quiz_id
      ),
      gear_agg AS (
        SELECT quiz_id,
          COUNT(*) AS gear_reviewed
        FROM camp_quiz_audit_gear_reviews
        GROUP BY quiz_id
      ),
      signoff_agg AS (
        SELECT quiz_id, COUNT(*) AS signoff_count
        FROM camp_quiz_audit_signoffs
        GROUP BY quiz_id
      ),
      last_act AS (
        SELECT quiz_id, MAX(created_at) AS last_activity
        FROM (
          SELECT quiz_id, created_at FROM camp_quiz_audit_edits
          UNION ALL
          SELECT quiz_id, created_at FROM camp_quiz_audit_notes
          UNION ALL
          SELECT quiz_id, signed_at AS created_at FROM camp_quiz_audit_signoffs
        ) sub
        GROUP BY quiz_id
      )
      SELECT
        s.quiz_id,
        s.quiz_topic,
        m.day,
        m.title,
        m.week,
        CASE
          WHEN s.quiz_id IN ('sdr-cold-calling') THEN 'SDR'
          WHEN s.quiz_id IN ('day4-mktg') THEN 'SDR'
          WHEN s.quiz_id IN ('day5', 'day11', 'day13', 'day14', 'day15') THEN 'AE / PSM / Renewals'
          ELSE 'All Roles'
        END AS path_tag,
        s.smes,
        s.sme_count,
        s.registered_count,
        COALESCE(q.question_count, 0) AS question_count,
        COALESCE(a.approved_count, 0) AS approved_count,
        0 AS gear_total,
        COALESCE(g.gear_reviewed, 0) AS gear_reviewed,
        COALESCE(si.signoff_count, 0) AS signoff_count,
        l.last_activity::TEXT
      FROM sme_agg s
      LEFT JOIN camp_quiz_metadata m ON m.quiz_id = s.quiz_id
      LEFT JOIN q_counts q ON q.quiz_id = s.quiz_id
      LEFT JOIN approvals a ON a.quiz_id = s.quiz_id
      LEFT JOIN gear_agg g ON g.quiz_id = s.quiz_id
      LEFT JOIN signoff_agg si ON si.quiz_id = s.quiz_id
      LEFT JOIN last_act l ON l.quiz_id = s.quiz_id
      ORDER BY
        CASE
          WHEN s.quiz_id = 'day1' THEN 1
          WHEN s.quiz_id = 'day2' THEN 2
          WHEN s.quiz_id = 'day3' THEN 3
          WHEN s.quiz_id = 'day4' THEN 4
          WHEN s.quiz_id = 'day4-mktg' THEN 5
          WHEN s.quiz_id = 'sdr-cold-calling' THEN 6
          WHEN s.quiz_id = 'day5' THEN 7
          WHEN s.quiz_id = 'day6' THEN 8
          WHEN s.quiz_id = 'day7' THEN 9
          WHEN s.quiz_id = 'day8' THEN 10
          WHEN s.quiz_id = 'day9' THEN 11
          WHEN s.quiz_id = 'day10' THEN 12
          WHEN s.quiz_id = 'day11' THEN 13
          WHEN s.quiz_id = 'day12' THEN 14
          WHEN s.quiz_id = 'day13' THEN 15
          WHEN s.quiz_id = 'day14-roe' THEN 16
          WHEN s.quiz_id = 'day14' THEN 17
          WHEN s.quiz_id = 'day15' THEN 18
          WHEN s.quiz_id = 'product-101' THEN 19
          ELSE 99
        END`,
      AuditTopicSchema,
      undefined,
      { label: "Fetch audit dashboard" }
    );

    return { topics };
  },
});
