import { api, z, postgres } from "@superblocksteam/sdk-api";

const APPS_DB = "c6e32cf4-ca66-42ae-aeb3-58c84ffae574";

const TOTAL_QUIZZES = 15;

const ADMIN_EMAILS = ["jt.bohland@amplitude.com"];

const TIERS = [
  { min: 0, max: 75, name: "Base Camper", emoji: "🏕️" },
  { min: 76, max: 150, name: "Trailblazer", emoji: "🥾" },
  { min: 151, max: 234, name: "Summit Seeker", emoji: "🧗" },
  { min: 235, max: 9999, name: "Pinnacle Achiever", emoji: "🏔️✨" },
] as const;

const WEEK_QUIZZES: Record<string, string[]> = {
  "Week 2": ["day1", "day2", "day3", "day4", "day5"],
  "Week 3": ["day6", "day7", "day8", "day9", "day10"],
  "Week 4": ["day11", "day12", "day13", "day14", "day15"],
};

const CamperSchema = z.object({
  userName: z.string(),
  userEmail: z.string(),
  userRole: z.string(),
  managerName: z.string(),
  region: z.string(),
  xp: z.number(),
  tier: z.object({ name: z.string(), emoji: z.string() }),
  quizzesPassed: z.number(),
  progress: z.string(),
  avgScore: z.number(),
  firstPassRate: z.number(),
  retakes: z.number(),
  reviews: z.number(),
  status: z.string(),
  lastActivity: z.string(),
});

export type Camper = z.infer<typeof CamperSchema>;

export default api({
  name: "CampGetCampers",
  description: "Returns per-learner aggregate data for the cAMPers table",
  integrations: {
    db: postgres(APPS_DB),
  },
  input: z.object({}),
  output: z.object({
    campers: z.array(CamperSchema),
  }),
  async run(ctx) {
    // 0. Get viewer records for manager & region
    const viewers = await ctx.integrations.db.query(
      `SELECT user_email, user_role, manager_name, region FROM camp_viewers LIMIT 500`,
      z.object({ user_email: z.string(), user_role: z.string(), manager_name: z.string(), region: z.string() }),
      undefined,
      { label: "Get viewer records for manager/region" }
    );
    const viewerMap = new Map(viewers.map((v) => [v.user_email.toLowerCase(), v]));

    // 0b. Get latest page visit per user
    const lastVisits = await ctx.integrations.db.query(
      `SELECT user_email, MAX(visited_at)::text AS last_visit
       FROM camp_page_visits
       GROUP BY user_email
       LIMIT 500`,
      z.object({ user_email: z.string(), last_visit: z.string() }),
      undefined,
      { label: "Get latest page visit per user" }
    );
    const lastVisitMap = new Map(lastVisits.map((v) => [v.user_email.toLowerCase(), v.last_visit]));

    // 1. Get all attempts (excluding admins)
    const allAttempts = await ctx.integrations.db.query(
      `SELECT
        id, user_email, user_name, user_role, quiz_id,
        attempt_number, score, total_questions, passed,
        time_spent_seconds, created_at::text
       FROM camp_quiz_attempts
       WHERE user_email != ALL($1::text[])
       ORDER BY user_email, created_at ASC
       LIMIT 5000`,
      z.object({
        id: z.number(),
        user_email: z.string(),
        user_name: z.string(),
        user_role: z.string(),
        quiz_id: z.string(),
        attempt_number: z.number(),
        score: z.number(),
        total_questions: z.number(),
        passed: z.boolean(),
        time_spent_seconds: z.number().nullable(),
        created_at: z.string(),
      }),
      [ADMIN_EMAILS],
      { label: "Get all learner attempts" }
    );

    // 2. Get all reviews
    const allReviews = await ctx.integrations.db.query(
      `SELECT user_email, quiz_id
       FROM camp_quiz_reviews
       WHERE user_email != ALL($1::text[])
       LIMIT 2000`,
      z.object({ user_email: z.string(), quiz_id: z.string() }),
      [ADMIN_EMAILS],
      { label: "Get all reviews" }
    );

    // Group by user
    const attemptsByUser = new Map<string, typeof allAttempts>();
    for (const a of allAttempts) {
      if (!attemptsByUser.has(a.user_email)) attemptsByUser.set(a.user_email, []);
      attemptsByUser.get(a.user_email)!.push(a);
    }

    const reviewsByUser = new Map<string, Set<string>>();
    for (const r of allReviews) {
      if (!reviewsByUser.has(r.user_email)) reviewsByUser.set(r.user_email, new Set());
      reviewsByUser.get(r.user_email)!.add(r.quiz_id);
    }

    const campers: z.infer<typeof CamperSchema>[] = [];

    for (const [email, userAttempts] of attemptsByUser) {
      const latestName = userAttempts[userAttempts.length - 1].user_name;
      const latestRole = userAttempts[userAttempts.length - 1].user_role;
      const lastQuizActivity = userAttempts[userAttempts.length - 1].created_at;
      const lastPageVisit = lastVisitMap.get(email.toLowerCase());
      const lastActivity = lastPageVisit && lastPageVisit > lastQuizActivity ? lastPageVisit : lastQuizActivity;

      // Quizzes passed = distinct quizzes where at least one attempt passed
      const passedQuizzes = new Set<string>();
      const firstAttemptResults: Record<string, boolean> = {};
      const firstAttemptPassed = new Set<string>();
      const started = new Set<string>();
      let totalScore = 0;
      let totalQuestions = 0;
      let retakeCount = 0;

      for (const a of userAttempts) {
        started.add(a.quiz_id);
        totalScore += a.score;
        totalQuestions += a.total_questions;

        if (a.passed) passedQuizzes.add(a.quiz_id);
        if (a.attempt_number === 1) {
          firstAttemptResults[a.quiz_id] = a.passed;
          if (a.passed) firstAttemptPassed.add(a.quiz_id);
        }
        if (a.attempt_number >= 2) retakeCount++;
      }

      const quizzesPassed = passedQuizzes.size;
      const avgScore = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;
      const firstPassCount = firstAttemptPassed.size;
      const totalQuizzesAttempted = started.size;
      const firstPassRate = totalQuizzesAttempted > 0
        ? Math.round((firstPassCount / totalQuizzesAttempted) * 100)
        : 0;

      const reviewCount = reviewsByUser.get(email)?.size ?? 0;

      // Status
      let status: string;
      if (quizzesPassed >= TOTAL_QUIZZES) {
        status = "✅ Complete";
      } else if (quizzesPassed > 0) {
        status = "🚶 In Progress";
      } else {
        status = "🏁 Started";
      }

      // XP calculation (same logic as leaderboard)
      let xp = 0;
      const startedXp = new Set<string>();
      for (const a of userAttempts) {
        if (!startedXp.has(a.quiz_id)) { startedXp.add(a.quiz_id); xp += 1; }
        if (a.attempt_number === 1 && a.passed) xp += 5;
        if (a.attempt_number === 2 && a.passed) xp += 3;
        if (a.attempt_number >= 3) xp += 1;
      }
      if (reviewCount > 0) xp += reviewCount * 2;

      // Milestones
      if (firstPassCount >= 5) xp += 10;
      if (firstPassCount >= 10) xp += 15;
      if (firstPassCount >= 15) xp += 20;

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
      for (const a of userAttempts) {
        if (a.attempt_number === 1 && a.passed && a.score === a.total_questions &&
            a.time_spent_seconds != null && a.time_spent_seconds <= 600) {
          xp += 15; // Ace
        }
        if (a.attempt_number === 1 && a.passed &&
            a.time_spent_seconds != null && a.time_spent_seconds <= 600) {
          xp += 7; // Speed
        }
      }
      // Hot Streak
      const firstAttemptsSorted = userAttempts
        .filter((a) => a.attempt_number === 1)
        .sort((a, b) => a.created_at.localeCompare(b.created_at));
      let streak = 0;
      for (const a of firstAttemptsSorted) {
        if (a.passed) { streak++; if (streak >= 3 && streak % 3 === 0) xp += 12; }
        else { streak = 0; }
      }
      // Clean Sweep
      for (const [, quizIds] of Object.entries(WEEK_QUIZZES)) {
        if (quizIds.every((qid) => firstAttemptResults[qid] === true)) xp += 10;
      }
      // Comeback
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

      const tier = TIERS.find((t) => xp >= t.min && xp <= t.max) ?? TIERS[0];

      const viewer = viewerMap.get(email.toLowerCase());
      campers.push({
        userName: latestName,
        userEmail: email,
        userRole: viewer?.user_role ?? latestRole,
        managerName: viewer?.manager_name ?? "",
        region: viewer?.region ?? "NAMER",
        xp,
        tier: { name: tier.name, emoji: tier.emoji },
        quizzesPassed,
        progress: `${quizzesPassed} / ${TOTAL_QUIZZES}`,
        avgScore,
        firstPassRate,
        retakes: retakeCount,
        reviews: reviewCount,
        status,
        lastActivity,
      });
    }

    // Sort by XP descending
    campers.sort((a, b) => b.xp - a.xp);

    return { campers };
  },
});
