import { api, z, postgres } from "@superblocksteam/sdk-api";

const APPS_DB = "c6e32cf4-ca66-42ae-aeb3-58c84ffae574";

// XP Point Values (same for all paths — structural/scoring rules are universal)
const XP = {
  START_QUIZ: 1,
  PASS_ATTEMPT_1: 5,
  PASS_ATTEMPT_2: 3,
  REVIEW_QUIZ: 2,
  RETAKE_ATTEMPT: 1,
  // Milestones
  MILESTONE_TIER_1: 10,
  MILESTONE_TIER_2: 15,
  MILESTONE_TIER_3: 20,
  REDEMPTION_ARC: 10,
  // Performance Bonuses
  ACE_UP_THE_SLEEVE: 15,
  HOT_STREAK: 12,
  CLEAN_SWEEP: 10,
  THE_COMEBACK: 10,
  SPEED_BONUS: 7,
  SAME_DAY_DOUBLE: 5,
};

// ─── Path definitions (server-side mirror of client/data/paths.ts) ───
type PathId = "ae" | "sdr" | "promo";

interface ServerPathConfig {
  id: PathId;
  quizOrder: string[];
  weekGroups: Record<string, string[]>;
  tiers: { min: number; max: number; name: string; emoji: string }[];
  milestones: number[]; // First-attempt-pass thresholds
  pinnacleThreshold: number;
}

const PATHS: Record<PathId, ServerPathConfig> = {
  ae: {
    id: "ae",
    quizOrder: ["day1","day2","day3","day4","day5","day6","day7","day8","day9","day10","day11","day12","day13","day14","day15"],
    weekGroups: {
      "Week 2": ["day1","day2","day3","day4","day5"],
      "Week 3": ["day6","day7","day8","day9","day10"],
      "Week 4": ["day11","day12","day13","day14","day15"],
    },
    tiers: [
      { min: 0, max: 75, name: "Base Camper", emoji: "\u{1F3D5}\uFE0F" },
      { min: 76, max: 150, name: "Trailblazer", emoji: "\u{1F97E}" },
      { min: 151, max: 234, name: "Summit Seeker", emoji: "\u{1F9D7}\u{1F3FC}" },
      { min: 235, max: 9999, name: "Pinnacle Achiever", emoji: "\u{1F3D4}\uFE0F\u2728" },
    ],
    milestones: [5, 10, 15],
    pinnacleThreshold: 235,
  },
  sdr: {
    id: "sdr",
    quizOrder: ["day1","day2","day3","day4","sdr-cold-calling","day6","day7","day8","day9","day10","day12"],
    weekGroups: {
      "Week 2": ["day1","day2","day3","day4"],
      "Week 3": ["sdr-cold-calling","day6","day7","day8"],
      "Week 4": ["day9","day10","day12"],
    },
    tiers: [
      { min: 0, max: 55, name: "Base Camper", emoji: "\u{1F3D5}\uFE0F" },
      { min: 56, max: 110, name: "Trailblazer", emoji: "\u{1F97E}" },
      { min: 111, max: 171, name: "Summit Seeker", emoji: "\u{1F9D7}\u{1F3FC}" },
      { min: 172, max: 9999, name: "Pinnacle Achiever", emoji: "\u{1F3D4}\uFE0F\u2728" },
    ],
    milestones: [4, 7, 11],
    pinnacleThreshold: 172,
  },
  promo: {
    id: "promo",
    quizOrder: ["day5","day9","day10","day11","day13","day14","day15"],
    weekGroups: {
      "Promo Week 1": ["day5","day9","day10"],
      "Promo Week 2": ["day11","day13","day14","day15"],
    },
    tiers: [
      { min: 0, max: 35, name: "Base Camper", emoji: "\u{1F3D5}\uFE0F" },
      { min: 36, max: 71, name: "Trailblazer", emoji: "\u{1F97E}" },
      { min: 72, max: 110, name: "Summit Seeker", emoji: "\u{1F9D7}\u{1F3FC}" },
      { min: 111, max: 9999, name: "Pinnacle Achiever", emoji: "\u{1F3D4}\uFE0F\u2728" },
    ],
    milestones: [2, 5, 7],
    pinnacleThreshold: 111,
  },
};

function getRolePathId(role: string): PathId {
  if (role === "SDR") return "sdr";
  if (role === "SDR \u2192 Velocity AE Promo") return "promo";
  return "ae";
}

export default api({
  name: "CampGetUserXp",
  description: "Calculates a user's total XP, tier, rank, and earned bonuses (path-aware)",
  integrations: {
    db: postgres(APPS_DB),
  },
  input: z.object({
    userEmail: z.string(),
  }),
  output: z.object({
    totalXp: z.number(),
    tier: z.object({
      name: z.string(),
      emoji: z.string(),
      min: z.number(),
      max: z.number(),
    }),
    rank: z.number(),
    totalUsers: z.number(),
    quizzesCompleted: z.number(),
    pinnacleThreshold: z.number(),
    pathId: z.string(),
    pathLabel: z.string(),
    pathQuizCount: z.number(),
    breakdown: z.object({
      core: z.number(),
      milestones: z.number(),
      bonuses: z.number(),
    }),
    earnedBonuses: z.array(z.object({
      id: z.string(),
      name: z.string(),
      emoji: z.string(),
      xp: z.number(),
      count: z.number(),
    })),
    milestones: z.array(z.object({
      id: z.string(),
      name: z.string(),
      earned: z.boolean(),
      xp: z.number(),
    })),
    hasFailedAny: z.boolean(),
    redemptionArcVisible: z.boolean(),
    redemptionArcEarned: z.boolean(),
  }),
  async run(ctx, input) {
    // Look up the user's role to determine their path
    const viewerRows = await ctx.integrations.db.query(
      `SELECT user_role FROM camp_viewers WHERE LOWER(user_email) = LOWER($1) LIMIT 1`,
      z.object({ user_role: z.string() }),
      [input.userEmail],
      { label: "Get user role for path" }
    );
    const userRole = viewerRows[0]?.user_role ?? "";
    const pathId = getRolePathId(userRole);
    const path = PATHS[pathId];

    // Path labels for output
    const pathLabels: Record<PathId, string> = { ae: "AE Path", sdr: "SDR Path", promo: "Promo Path" };

    // Get all attempts for this user
    const attempts = await ctx.integrations.db.query(
      `SELECT id, quiz_id, attempt_number, score, total_questions, passed, time_spent_seconds, created_at::text
       FROM camp_quiz_attempts
       WHERE user_email = $1
       ORDER BY created_at ASC
       LIMIT 200`,
      z.object({
        id: z.number(),
        quiz_id: z.string(),
        attempt_number: z.number(),
        score: z.number(),
        total_questions: z.number(),
        passed: z.boolean(),
        time_spent_seconds: z.number().nullable(),
        created_at: z.string(),
      }),
      [input.userEmail],
      { label: "Get all user attempts" }
    );

    // Get review count
    const reviewRows = await ctx.integrations.db.query(
      `SELECT quiz_id, COUNT(*)::int AS review_count
       FROM camp_quiz_reviews
       WHERE user_email = $1
       GROUP BY quiz_id
       LIMIT 50`,
      z.object({ quiz_id: z.string(), review_count: z.number() }),
      [input.userEmail],
      { label: "Get review counts" }
    );

    // Only count XP for quizzes in the user's path
    const pathQuizSet = new Set(path.quizOrder);

    // ========== CORE XP CALCULATION ==========
    let coreXp = 0;
    const startedQuizzes = new Set<string>();
    const firstAttemptPassed = new Set<string>();
    const secondAttemptPassed = new Set<string>();
    const retakeAttempts = new Set<string>();
    const quizzesCompleted = new Set<string>();
    const firstAttemptResults: Record<string, boolean> = {};

    for (const a of attempts) {
      if (!pathQuizSet.has(a.quiz_id)) continue; // Skip quizzes not in user's path

      if (!startedQuizzes.has(a.quiz_id)) {
        startedQuizzes.add(a.quiz_id);
        coreXp += XP.START_QUIZ;
      }

      if (a.attempt_number === 1) {
        firstAttemptResults[a.quiz_id] = a.passed;
      }

      if (a.attempt_number === 1 && a.passed) {
        firstAttemptPassed.add(a.quiz_id);
        coreXp += XP.PASS_ATTEMPT_1;
      }
      if (a.attempt_number === 2 && a.passed) {
        secondAttemptPassed.add(a.quiz_id);
        coreXp += XP.PASS_ATTEMPT_2;
      }

      if (a.attempt_number >= 3) {
        const retakeKey = `${a.quiz_id}_${a.attempt_number}`;
        if (!retakeAttempts.has(retakeKey)) {
          retakeAttempts.add(retakeKey);
          coreXp += XP.RETAKE_ATTEMPT;
        }
      }

      if (a.attempt_number >= 2 || a.passed) {
        quizzesCompleted.add(a.quiz_id);
      }
    }

    // Review XP — only for path quizzes
    const reviewedQuizzes = new Set<string>();
    for (const r of reviewRows) {
      if (!pathQuizSet.has(r.quiz_id)) continue;
      if (!reviewedQuizzes.has(r.quiz_id)) {
        reviewedQuizzes.add(r.quiz_id);
        coreXp += XP.REVIEW_QUIZ;
      }
    }

    // ========== MILESTONE XP (path-aware thresholds) ==========
    let milestoneXp = 0;
    const milestonesList: { id: string; name: string; earned: boolean; xp: number }[] = [];
    const firstPassCount = firstAttemptPassed.size;

    const milestoneXpValues = [XP.MILESTONE_TIER_1, XP.MILESTONE_TIER_2, XP.MILESTONE_TIER_3];
    path.milestones.forEach((threshold, idx) => {
      const xpValue = milestoneXpValues[idx] ?? 0;
      const earned = firstPassCount >= threshold;
      if (earned) milestoneXp += xpValue;
      milestonesList.push({
        id: `m${threshold}`,
        name: `${threshold} First-Attempt Passes`,
        earned,
        xp: xpValue,
      });
    });

    // Redemption Arc
    const hasFailedAny = Object.values(firstAttemptResults).some((r) => r === false);
    const failedQuizIds = Object.entries(firstAttemptResults)
      .filter(([, passed]) => !passed)
      .map(([quizId]) => quizId);
    const allFailedNowPassed = failedQuizIds.length > 0 &&
      failedQuizIds.every((qid) =>
        attempts.some((a) => a.quiz_id === qid && a.passed && a.attempt_number >= 2)
      );
    const redemptionArcVisible = hasFailedAny;
    const redemptionArcEarned = allFailedNowPassed;
    if (redemptionArcEarned) milestoneXp += XP.REDEMPTION_ARC;
    milestonesList.push({
      id: "redemption",
      name: "Redemption Arc",
      earned: redemptionArcEarned,
      xp: XP.REDEMPTION_ARC,
    });

    // ========== PERFORMANCE BONUSES (only for path quizzes) ==========
    let bonusXp = 0;
    const earnedBonuses: { id: string; name: string; emoji: string; xp: number; count: number }[] = [];

    // Filter attempts to path quizzes only
    const pathAttempts = attempts.filter((a) => pathQuizSet.has(a.quiz_id));

    // Ace Up the Sleeve
    let aceCount = 0;
    for (const a of pathAttempts) {
      if (a.attempt_number === 1 && a.passed && a.score === a.total_questions &&
          a.time_spent_seconds != null && a.time_spent_seconds <= 600) {
        aceCount++;
      }
    }
    if (aceCount > 0) {
      bonusXp += aceCount * XP.ACE_UP_THE_SLEEVE;
      earnedBonuses.push({ id: "ace", name: "Ace", emoji: "\uD83D\uDCAF", xp: XP.ACE_UP_THE_SLEEVE, count: aceCount });
    }

    // Speed Bonus
    let speedCount = 0;
    for (const a of pathAttempts) {
      if (a.attempt_number === 1 && a.passed &&
          a.time_spent_seconds != null && a.time_spent_seconds <= 600) {
        speedCount++;
      }
    }
    if (speedCount > 0) {
      bonusXp += speedCount * XP.SPEED_BONUS;
      earnedBonuses.push({ id: "speed", name: "Speed Bonus", emoji: "\u26A1", xp: XP.SPEED_BONUS, count: speedCount });
    }

    // Hot Streak — 3 consecutive first-attempt passes (path order)
    const firstAttemptsSorted = pathAttempts
      .filter((a) => a.attempt_number === 1)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
    let streak = 0;
    let hotStreakCount = 0;
    for (const a of firstAttemptsSorted) {
      if (a.passed) {
        streak++;
        if (streak >= 3 && streak % 3 === 0) hotStreakCount++;
      } else {
        streak = 0;
      }
    }
    if (hotStreakCount > 0) {
      bonusXp += hotStreakCount * XP.HOT_STREAK;
      earnedBonuses.push({ id: "hotstreak", name: "Hot Streak", emoji: "\uD83D\uDD25", xp: XP.HOT_STREAK, count: hotStreakCount });
    }

    // Clean Sweep — all quizzes in a week group passed on first attempt (path-specific week groups)
    let cleanSweepCount = 0;
    for (const [, quizIds] of Object.entries(path.weekGroups)) {
      const allFirstAttemptPass = quizIds.every((qid) => firstAttemptResults[qid] === true);
      if (allFirstAttemptPass) cleanSweepCount++;
    }
    if (cleanSweepCount > 0) {
      bonusXp += cleanSweepCount * XP.CLEAN_SWEEP;
      earnedBonuses.push({ id: "cleansweep", name: "Clean Sweep", emoji: "\uD83E\uDDF9", xp: XP.CLEAN_SWEEP, count: cleanSweepCount });
    }

    // The Comeback
    let comebackCount = 0;
    for (const a of pathAttempts) {
      if (a.attempt_number === 2 && a.score === a.total_questions && firstAttemptResults[a.quiz_id] === false) {
        comebackCount++;
      }
    }
    if (comebackCount > 0) {
      bonusXp += comebackCount * XP.THE_COMEBACK;
      earnedBonuses.push({ id: "comeback", name: "The Comeback", emoji: "\uD83D\uDCAA", xp: XP.THE_COMEBACK, count: comebackCount });
    }

    // Same-Day Double
    const dayMap = new Map<string, number>();
    for (const a of pathAttempts) {
      const day = a.created_at.substring(0, 10);
      dayMap.set(day, (dayMap.get(day) ?? 0) + 1);
    }
    let sameDayCount = 0;
    for (const [, count] of dayMap) {
      if (count >= 2) sameDayCount++;
    }
    if (sameDayCount > 0) {
      bonusXp += sameDayCount * XP.SAME_DAY_DOUBLE;
      earnedBonuses.push({ id: "sameday", name: "Same-Day Double", emoji: "\uD83D\uDCC5", xp: XP.SAME_DAY_DOUBLE, count: sameDayCount });
    }

    // ========== TOTAL ==========
    const totalXp = coreXp + milestoneXp + bonusXp;

    // Determine tier using path-specific thresholds
    const tier = path.tiers.find((t) => totalXp >= t.min && totalXp <= t.max) ?? path.tiers[0];

    // Get total users for ranking
    const rankResult = await ctx.integrations.db.query(
      `SELECT COUNT(DISTINCT user_email)::int AS total_users
       FROM camp_quiz_attempts`,
      z.object({ total_users: z.number() }),
      undefined,
      { label: "Get total users for ranking" }
    );
    const totalUsers = rankResult[0]?.total_users ?? 1;
    const rank = 1; // Placeholder — real rank computed in leaderboard API

    return {
      totalXp,
      tier: { name: tier.name, emoji: tier.emoji, min: tier.min, max: tier.max },
      rank,
      totalUsers,
      quizzesCompleted: quizzesCompleted.size,
      pinnacleThreshold: path.pinnacleThreshold,
      pathId: path.id,
      pathLabel: pathLabels[pathId],
      pathQuizCount: path.quizOrder.length,
      breakdown: {
        core: coreXp,
        milestones: milestoneXp,
        bonuses: bonusXp,
      },
      earnedBonuses,
      milestones: milestonesList,
      hasFailedAny,
      redemptionArcVisible,
      redemptionArcEarned,
    };
  },
});
