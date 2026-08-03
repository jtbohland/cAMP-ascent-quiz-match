import { api, z, postgres } from "@superblocksteam/sdk-api";

const APPS_DB = "c6e32cf4-ca66-42ae-aeb3-58c84ffae574";

// Must match the XP logic in get-user-xp.ts
const TIERS = [
  { min: 0, max: 75, name: "Base Camper", emoji: "\u{1F3D5}\uFE0F" },
  { min: 76, max: 150, name: "Trailblazer", emoji: "\u{1F97E}" },
  { min: 151, max: 234, name: "Summit Seeker", emoji: "\u{1F9D7}" },
  { min: 235, max: 9999, name: "Pinnacle Achiever", emoji: "\u{1F3D4}\uFE0F\u2728" },
] as const;

// Admin emails excluded from leaderboard
const ADMIN_EMAILS = ["jt.bohland@amplitude.com"];

export default api({
  name: "CampGetLeaderboard",
  description: "Gets the XP leaderboard with all users ranked",
  integrations: {
    db: postgres(APPS_DB),
  },
  input: z.object({}),
  output: z.object({
    leaderboard: z.array(z.object({
      rank: z.number(),
      userName: z.string(),
      userEmail: z.string(),
      userRole: z.string(),
      region: z.string(),
      totalXp: z.number(),
      tier: z.object({
        name: z.string(),
        emoji: z.string(),
      }),
      quizzesCompleted: z.number(),
      firstAttemptPasses: z.number(),
    })),
  }),
  async run(ctx) {
    // Get all attempts grouped by user
    const userStats = await ctx.integrations.db.query(
      `SELECT
        a.user_email,
        MAX(a.user_name) AS user_name,
        COUNT(DISTINCT a.quiz_id)::int AS quizzes_started,
        COUNT(DISTINCT CASE WHEN a.attempt_number >= 2 OR a.passed THEN a.quiz_id END)::int AS quizzes_completed,
        COUNT(DISTINCT CASE WHEN a.attempt_number = 1 AND a.passed THEN a.quiz_id END)::int AS first_attempt_passes
       FROM camp_quiz_attempts a
       WHERE a.user_email != ALL($1::text[])
       GROUP BY a.user_email
       ORDER BY quizzes_completed DESC
       LIMIT 100`,
      z.object({
        user_email: z.string(),
        user_name: z.string(),
        quizzes_started: z.number(),
        quizzes_completed: z.number(),
        first_attempt_passes: z.number(),
      }),
      [ADMIN_EMAILS],
      { label: "Get all user stats for leaderboard" }
    );

    // For each user, calculate their XP (simplified version for leaderboard)
    // We use the same core formula but can't compute all bonuses server-side
    // without loading all individual attempt data. We'll use a simpler approximation
    // that covers the main XP sources.
    const allAttempts = await ctx.integrations.db.query(
      `SELECT user_email, quiz_id, attempt_number, score, total_questions, passed, time_spent_seconds, created_at::text
       FROM camp_quiz_attempts
       WHERE user_email != ALL($1::text[])
       ORDER BY user_email, created_at ASC
       LIMIT 5000`,
      z.object({
        user_email: z.string(),
        quiz_id: z.string(),
        attempt_number: z.number(),
        score: z.number(),
        total_questions: z.number(),
        passed: z.boolean(),
        time_spent_seconds: z.number().nullable(),
        created_at: z.string(),
      }),
      [ADMIN_EMAILS],
      { label: "Get all attempts for XP calculation" }
    );

    // Get reviews per user
    const allReviews = await ctx.integrations.db.query(
      `SELECT user_email, quiz_id
       FROM camp_quiz_reviews
       WHERE user_email != ALL($1::text[])
       LIMIT 2000`,
      z.object({ user_email: z.string(), quiz_id: z.string() }),
      [ADMIN_EMAILS],
      { label: "Get all reviews" }
    );

    // Week groupings for Clean Sweep
    const WEEK_QUIZZES: Record<string, string[]> = {
      "Week 2": ["day1", "day2", "day3", "day4", "day5"],
      "Week 3": ["day6", "day7", "day8", "day9", "day10"],
      "Week 4": ["day11", "day12", "day13", "day14", "day15"],
    };

    // Fetch viewer records for role & region
    const viewers = await ctx.integrations.db.query(
      `SELECT user_email, user_role, region FROM camp_viewers LIMIT 500`,
      z.object({ user_email: z.string(), user_role: z.string(), region: z.string() }),
      undefined,
      { label: "Get viewer records for role/region" }
    );
    const viewerMap = new Map(viewers.map((v) => [v.user_email.toLowerCase(), v]));

    // Calculate XP per user
    const userXpMap = new Map<string, number>();

    // Group attempts by user
    const attemptsByUser = new Map<string, typeof allAttempts>();
    for (const a of allAttempts) {
      if (!attemptsByUser.has(a.user_email)) attemptsByUser.set(a.user_email, []);
      attemptsByUser.get(a.user_email)!.push(a);
    }

    // Group reviews by user
    const reviewsByUser = new Map<string, Set<string>>();
    for (const r of allReviews) {
      if (!reviewsByUser.has(r.user_email)) reviewsByUser.set(r.user_email, new Set());
      reviewsByUser.get(r.user_email)!.add(r.quiz_id);
    }

    for (const [email, userAttempts] of attemptsByUser) {
      let xp = 0;
      const started = new Set<string>();
      const firstAttemptResults: Record<string, boolean> = {};
      const firstAttemptPassed = new Set<string>();

      for (const a of userAttempts) {
        // Start XP
        if (!started.has(a.quiz_id)) {
          started.add(a.quiz_id);
          xp += 1;
        }
        // First attempt tracking
        if (a.attempt_number === 1) {
          firstAttemptResults[a.quiz_id] = a.passed;
          if (a.passed) {
            firstAttemptPassed.add(a.quiz_id);
            xp += 5;
          }
        }
        // Pass on attempt 2
        if (a.attempt_number === 2 && a.passed) xp += 3;
        // Retake attempts
        if (a.attempt_number >= 3) xp += 1;
      }

      // Review XP (cap at 1 per quiz)
      const reviews = reviewsByUser.get(email);
      if (reviews) xp += reviews.size * 2;

      // Milestones
      const fpCount = firstAttemptPassed.size;
      if (fpCount >= 5) xp += 10;
      if (fpCount >= 10) xp += 15;
      if (fpCount >= 15) xp += 20;

      // Redemption Arc
      const failedQuizIds = Object.entries(firstAttemptResults)
        .filter(([, passed]) => !passed)
        .map(([qid]) => qid);
      if (failedQuizIds.length > 0) {
        const allRedeemed = failedQuizIds.every((qid) =>
          userAttempts.some((a) => a.quiz_id === qid && a.passed && a.attempt_number >= 2)
        );
        if (allRedeemed) xp += 10;
      }

      // Performance Bonuses
      // Ace Up the Sleeve
      for (const a of userAttempts) {
        if (a.attempt_number === 1 && a.passed && a.score === a.total_questions &&
            a.time_spent_seconds != null && a.time_spent_seconds <= 600) {
          xp += 15;
        }
      }
      // Speed Bonus
      for (const a of userAttempts) {
        if (a.attempt_number === 1 && a.passed &&
            a.time_spent_seconds != null && a.time_spent_seconds <= 600) {
          xp += 7;
        }
      }
      // Hot Streak
      const firstAttemptsSorted = userAttempts
        .filter((a) => a.attempt_number === 1)
        .sort((a, b) => a.created_at.localeCompare(b.created_at));
      let streak = 0;
      for (const a of firstAttemptsSorted) {
        if (a.passed) {
          streak++;
          if (streak >= 3 && streak % 3 === 0) xp += 12;
        } else {
          streak = 0;
        }
      }
      // Clean Sweep
      for (const [, quizIds] of Object.entries(WEEK_QUIZZES)) {
        if (quizIds.every((qid) => firstAttemptResults[qid] === true)) xp += 10;
      }
      // The Comeback
      for (const a of userAttempts) {
        if (a.attempt_number === 2 && a.score === a.total_questions && firstAttemptResults[a.quiz_id] === false) {
          xp += 10;
        }
      }
      // Same-Day Double
      const dayMap = new Map<string, number>();
      for (const a of userAttempts) {
        const day = a.created_at.substring(0, 10);
        dayMap.set(day, (dayMap.get(day) ?? 0) + 1);
      }
      for (const [, count] of dayMap) {
        if (count >= 2) xp += 5;
      }

      userXpMap.set(email, xp);
    }

    // Build sorted leaderboard
    const leaderboard = userStats
      .map((u) => {
        const xp = userXpMap.get(u.user_email) ?? 0;
        const tier = TIERS.find((t) => xp >= t.min && xp <= t.max) ?? TIERS[0];
        const viewer = viewerMap.get(u.user_email.toLowerCase());
        return {
          userName: u.user_name,
          userEmail: u.user_email,
          userRole: viewer?.user_role ?? u.user_name,
          region: viewer?.region ?? "NAMER",
          totalXp: xp,
          tier: { name: tier.name, emoji: tier.emoji },
          quizzesCompleted: u.quizzes_completed,
          firstAttemptPasses: u.first_attempt_passes,
          rank: 0,
        };
      })
      .sort((a, b) => b.totalXp - a.totalXp)
      .map((entry, idx) => ({ ...entry, rank: idx + 1 }));

    return { leaderboard };
  },
});
