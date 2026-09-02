import { api, z, postgres } from "@superblocksteam/sdk-api";

const APPS_DB = "c6e32cf4-ca66-42ae-aeb3-58c84ffae574";

// ─── Path definitions (server-side mirror) ───
type PathId = "ae" | "sdr" | "promo";

interface ServerPathConfig {
  id: PathId;
  label: string;
  quizOrder: string[];
  weekGroups: Record<string, string[]>;
  tiers: { min: number; max: number; name: string; emoji: string }[];
  pinnacleThreshold: number;
  milestones: number[];
}

const PATHS: Record<PathId, ServerPathConfig> = {
  ae: {
    id: "ae", label: "AE Path",
    quizOrder: ["day1","day2","day3","day4","day5","day6","day7","day8","day9","day10","day11","day12","day13","day14","day15"],
    weekGroups: { "Week 2": ["day1","day2","day3","day4","day5"], "Week 3": ["day6","day7","day8","day9","day10"], "Week 4": ["day11","day12","day13","day14","day15"] },
    tiers: [
      { min: 0, max: 75, name: "Base Camper", emoji: "\u{1F3D5}\uFE0F" },
      { min: 76, max: 150, name: "Trailblazer", emoji: "\u{1F97E}" },
      { min: 151, max: 234, name: "Summit Seeker", emoji: "\u{1F9D7}" },
      { min: 235, max: 9999, name: "Pinnacle Achiever", emoji: "\u{1F3D4}\uFE0F\u2728" },
    ],
    pinnacleThreshold: 235, milestones: [5, 10, 15],
  },
  sdr: {
    id: "sdr", label: "SDR Path",
    quizOrder: ["day1","day2","day3","day4","sdr-cold-calling","day6","day7","day8","day9","day10","day12"],
    weekGroups: { "Week 2": ["day1","day2","day3","day4"], "Week 3": ["sdr-cold-calling","day6","day7","day8"], "Week 4": ["day9","day10","day12"] },
    tiers: [
      { min: 0, max: 55, name: "Base Camper", emoji: "\u{1F3D5}\uFE0F" },
      { min: 56, max: 110, name: "Trailblazer", emoji: "\u{1F97E}" },
      { min: 111, max: 171, name: "Summit Seeker", emoji: "\u{1F9D7}" },
      { min: 172, max: 9999, name: "Pinnacle Achiever", emoji: "\u{1F3D4}\uFE0F\u2728" },
    ],
    pinnacleThreshold: 172, milestones: [4, 7, 11],
  },
  promo: {
    id: "promo", label: "Promo Path",
    quizOrder: ["day5","day9","day10","day11","day13","day14","day15"],
    weekGroups: { "Promo Week 1": ["day5","day9","day10"], "Promo Week 2": ["day11","day13","day14","day15"] },
    tiers: [
      { min: 0, max: 35, name: "Base Camper", emoji: "\u{1F3D5}\uFE0F" },
      { min: 36, max: 71, name: "Trailblazer", emoji: "\u{1F97E}" },
      { min: 72, max: 110, name: "Summit Seeker", emoji: "\u{1F9D7}" },
      { min: 111, max: 9999, name: "Pinnacle Achiever", emoji: "\u{1F3D4}\uFE0F\u2728" },
    ],
    pinnacleThreshold: 111, milestones: [2, 5, 7],
  },
};

function getRolePathId(role: string): PathId {
  if (role === "SDR") return "sdr";
  if (role === "SDR \u2192 Velocity AE Promo") return "promo";
  return "ae";
}

// Admin emails excluded from leaderboard
const ADMIN_EMAILS = ["jt.bohland@amplitude.com"];

function calculateUserXp(
  userAttempts: { quiz_id: string; attempt_number: number; score: number; total_questions: number; passed: boolean; time_spent_seconds: number | null; created_at: string }[],
  reviewedQuizIds: Set<string>,
  path: ServerPathConfig,
): number {
  const pathQuizSet = new Set(path.quizOrder);
  let xp = 0;
  const started = new Set<string>();
  const firstAttemptResults: Record<string, boolean> = {};
  const firstAttemptPassed = new Set<string>();

  for (const a of userAttempts) {
    if (!pathQuizSet.has(a.quiz_id)) continue;
    if (!started.has(a.quiz_id)) { started.add(a.quiz_id); xp += 1; }
    if (a.attempt_number === 1) {
      firstAttemptResults[a.quiz_id] = a.passed;
      if (a.passed) { firstAttemptPassed.add(a.quiz_id); xp += 5; }
    }
    if (a.attempt_number === 2 && a.passed) xp += 3;
    if (a.attempt_number >= 3) xp += 1;
  }

  // Review XP
  for (const qid of reviewedQuizIds) {
    if (pathQuizSet.has(qid)) xp += 2;
  }

  // Milestones (path-aware)
  const fpCount = firstAttemptPassed.size;
  const milestoneXpValues = [10, 15, 20];
  path.milestones.forEach((threshold, idx) => {
    if (fpCount >= threshold) xp += milestoneXpValues[idx] ?? 0;
  });

  // Redemption Arc
  const failedQuizIds = Object.entries(firstAttemptResults).filter(([, p]) => !p).map(([qid]) => qid);
  if (failedQuizIds.length > 0) {
    const allRedeemed = failedQuizIds.every((qid) =>
      userAttempts.some((a) => a.quiz_id === qid && a.passed && a.attempt_number >= 2)
    );
    if (allRedeemed) xp += 10;
  }

  // Performance Bonuses
  const pathAttempts = userAttempts.filter((a) => pathQuizSet.has(a.quiz_id));

  // Ace + Speed
  for (const a of pathAttempts) {
    if (a.attempt_number === 1 && a.passed && a.score === a.total_questions &&
        a.time_spent_seconds != null && a.time_spent_seconds <= 600) xp += 15;
  }
  for (const a of pathAttempts) {
    if (a.attempt_number === 1 && a.passed &&
        a.time_spent_seconds != null && a.time_spent_seconds <= 600) xp += 7;
  }

  // Hot Streak
  const firstAttemptsSorted = pathAttempts
    .filter((a) => a.attempt_number === 1)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  let streak = 0;
  for (const a of firstAttemptsSorted) {
    if (a.passed) { streak++; if (streak >= 3 && streak % 3 === 0) xp += 12; }
    else streak = 0;
  }

  // Clean Sweep (path-specific week groups)
  for (const [, quizIds] of Object.entries(path.weekGroups)) {
    if (quizIds.every((qid) => firstAttemptResults[qid] === true)) xp += 10;
  }

  // Comeback
  for (const a of pathAttempts) {
    if (a.attempt_number === 2 && a.score === a.total_questions && firstAttemptResults[a.quiz_id] === false) xp += 10;
  }

  // Same-Day Double
  const dayMap = new Map<string, number>();
  for (const a of pathAttempts) {
    const day = a.created_at.substring(0, 10);
    dayMap.set(day, (dayMap.get(day) ?? 0) + 1);
  }
  for (const [, count] of dayMap) { if (count >= 2) xp += 5; }

  return xp;
}

export default api({
  name: "CampGetLeaderboard",
  description: "Gets the XP leaderboard with all users ranked (path-aware)",
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
      pathId: z.string(),
      pathLabel: z.string(),
      totalXp: z.number(),
      pinnacleThreshold: z.number(),
      tier: z.object({
        name: z.string(),
        emoji: z.string(),
      }),
      quizzesCompleted: z.number(),
      firstAttemptPasses: z.number(),
    })),
  }),
  async run(ctx) {
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

    const allReviews = await ctx.integrations.db.query(
      `SELECT user_email, quiz_id
       FROM camp_quiz_reviews
       WHERE user_email != ALL($1::text[])
       LIMIT 2000`,
      z.object({ user_email: z.string(), quiz_id: z.string() }),
      [ADMIN_EMAILS],
      { label: "Get all reviews" }
    );

    // Fetch viewer records for role & region
    const viewers = await ctx.integrations.db.query(
      `SELECT user_email, user_role, region FROM camp_viewers LIMIT 500`,
      z.object({ user_email: z.string(), user_role: z.string(), region: z.string() }),
      undefined,
      { label: "Get viewer records for role/region" }
    );
    const viewerMap = new Map(viewers.map((v) => [v.user_email.toLowerCase(), v]));

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

    // Build sorted leaderboard
    const leaderboard = userStats
      .map((u) => {
        const viewer = viewerMap.get(u.user_email.toLowerCase());
        const userRole = viewer?.user_role ?? "Velocity AE";
        const pathId = getRolePathId(userRole);
        const path = PATHS[pathId];

        const userAttempts = attemptsByUser.get(u.user_email) ?? [];
        const reviews = reviewsByUser.get(u.user_email) ?? new Set<string>();
        const xp = calculateUserXp(userAttempts, reviews, path);

        const tier = path.tiers.find((t) => xp >= t.min && xp <= t.max) ?? path.tiers[0];

        return {
          userName: u.user_name,
          userEmail: u.user_email,
          userRole,
          region: viewer?.region ?? "NAMER",
          pathId: path.id,
          pathLabel: path.label,
          totalXp: xp,
          pinnacleThreshold: path.pinnacleThreshold,
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
