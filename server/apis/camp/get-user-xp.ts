import { api, z, postgres } from "@superblocksteam/sdk-api";

const APPS_DB = "c6e32cf4-ca66-42ae-aeb3-58c84ffae574";

// XP Point Values
const XP = {
  START_QUIZ: 1,
  PASS_ATTEMPT_1: 5,
  PASS_ATTEMPT_2: 3,
  REVIEW_QUIZ: 2,
  RETAKE_ATTEMPT: 1,
  // Milestones
  MILESTONE_5_FIRST_PASS: 10,
  MILESTONE_10_FIRST_PASS: 15,
  MILESTONE_15_FIRST_PASS: 20,
  REDEMPTION_ARC: 10,
  // Performance Bonuses
  ACE_UP_THE_SLEEVE: 15,
  HOT_STREAK: 12,
  CLEAN_SWEEP: 10,
  THE_COMEBACK: 10,
  SPEED_BONUS: 7,
  SAME_DAY_DOUBLE: 5,
};

// Tier thresholds
const TIERS = [
  { min: 0, max: 75, name: "Base Camper", emoji: "\u{1F3D5}\uFE0F" },
  { min: 76, max: 150, name: "Trailblazer", emoji: "\u{1F97E}" },
  { min: 151, max: 234, name: "Summit Seeker", emoji: "\u{1F9D7}\u{1F3FC}" },
  { min: 235, max: 9999, name: "Pinnacle Achiever", emoji: "\u{1F3D4}\uFE0F\u2728" },
] as const;

const PINNACLE_THRESHOLD = 235;

// Week groupings
const WEEK_QUIZZES: Record<string, string[]> = {
  "Week 2": ["day1", "day2", "day3", "day4", "day5"],
  "Week 3": ["day6", "day7", "day8", "day9", "day10"],
  "Week 4": ["day11", "day12", "day13", "day14", "day15"],
};

export default api({
  name: "CampGetUserXp",
  description: "Calculates a user's total XP, tier, rank, and earned bonuses",
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
    // For the surprise bonus visibility
    hasFailedAny: z.boolean(),
    redemptionArcVisible: z.boolean(),
    redemptionArcEarned: z.boolean(),
  }),
  async run(ctx, input) {
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

    // ========== CORE XP CALCULATION ==========
    let coreXp = 0;
    const startedQuizzes = new Set<string>();
    const firstAttemptPassed = new Set<string>(); // Passed on attempt 1
    const secondAttemptPassed = new Set<string>(); // Passed on attempt 2
    const retakeAttempts = new Set<string>(); // Track retake attempts (3, 4)
    const quizzesCompleted = new Set<string>(); // Any quiz with 2+ attempts or passed

    // Track first attempt results per quiz for Clean Sweep
    const firstAttemptResults: Record<string, boolean> = {};

    for (const a of attempts) {
      // +1 XP for starting a quiz (first attempt only)
      if (!startedQuizzes.has(a.quiz_id)) {
        startedQuizzes.add(a.quiz_id);
        coreXp += XP.START_QUIZ;
      }

      // Track first attempt result
      if (a.attempt_number === 1) {
        firstAttemptResults[a.quiz_id] = a.passed;
      }

      // Pass on attempt 1
      if (a.attempt_number === 1 && a.passed) {
        firstAttemptPassed.add(a.quiz_id);
        coreXp += XP.PASS_ATTEMPT_1;
      }
      // Pass on attempt 2
      if (a.attempt_number === 2 && a.passed) {
        secondAttemptPassed.add(a.quiz_id);
        coreXp += XP.PASS_ATTEMPT_2;
      }

      // Retake attempts (3 and 4) — +1 each, max 2 per quiz
      if (a.attempt_number >= 3) {
        const retakeKey = `${a.quiz_id}_${a.attempt_number}`;
        if (!retakeAttempts.has(retakeKey)) {
          retakeAttempts.add(retakeKey);
          coreXp += XP.RETAKE_ATTEMPT;
        }
      }

      // Track completion
      if (a.attempt_number >= 2 || a.passed) {
        quizzesCompleted.add(a.quiz_id);
      }
    }

    // Review XP — +2 per quiz reviewed (cap at 1 per quiz)
    const reviewedQuizzes = new Set<string>();
    for (const r of reviewRows) {
      if (!reviewedQuizzes.has(r.quiz_id)) {
        reviewedQuizzes.add(r.quiz_id);
        coreXp += XP.REVIEW_QUIZ;
      }
    }

    // ========== MILESTONE XP ==========
    let milestoneXp = 0;
    const milestonesList: { id: string; name: string; earned: boolean; xp: number }[] = [];

    const firstPassCount = firstAttemptPassed.size;

    // 5 first-attempt passes
    const m5 = firstPassCount >= 5;
    if (m5) milestoneXp += XP.MILESTONE_5_FIRST_PASS;
    milestonesList.push({ id: "m5", name: "5 First-Attempt Passes", earned: m5, xp: XP.MILESTONE_5_FIRST_PASS });

    // 10 first-attempt passes
    const m10 = firstPassCount >= 10;
    if (m10) milestoneXp += XP.MILESTONE_10_FIRST_PASS;
    milestonesList.push({ id: "m10", name: "10 First-Attempt Passes", earned: m10, xp: XP.MILESTONE_10_FIRST_PASS });

    // 15 first-attempt passes (perfect run)
    const m15 = firstPassCount >= 15;
    if (m15) milestoneXp += XP.MILESTONE_15_FIRST_PASS;
    milestonesList.push({ id: "m15", name: "15 First-Attempt Passes", earned: m15, xp: XP.MILESTONE_15_FIRST_PASS });

    // Redemption Arc — failed at least one quiz on attempt 1, then retook and eventually passed ALL failed quizzes
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

    // ========== PERFORMANCE BONUSES ==========
    let bonusXp = 0;
    const earnedBonuses: { id: string; name: string; emoji: string; xp: number; count: number }[] = [];

    // ♠️ Ace Up the Sleeve — 10/10 on attempt 1 in ≤10 min
    let aceCount = 0;
    for (const a of attempts) {
      if (
        a.attempt_number === 1 &&
        a.passed &&
        a.score === a.total_questions &&
        a.time_spent_seconds != null &&
        a.time_spent_seconds <= 600
      ) {
        aceCount++;
      }
    }
    if (aceCount > 0) {
      bonusXp += aceCount * XP.ACE_UP_THE_SLEEVE;
      earnedBonuses.push({ id: "ace", name: "Ace", emoji: "\uD83D\uDCAF", xp: XP.ACE_UP_THE_SLEEVE, count: aceCount });
    }

    // ⚡ Speed Bonus — pass attempt 1 in under 10 min (but NOT if also Ace — they stack)
    let speedCount = 0;
    for (const a of attempts) {
      if (
        a.attempt_number === 1 &&
        a.passed &&
        a.time_spent_seconds != null &&
        a.time_spent_seconds <= 600
      ) {
        speedCount++;
      }
    }
    if (speedCount > 0) {
      bonusXp += speedCount * XP.SPEED_BONUS;
      earnedBonuses.push({ id: "speed", name: "Speed Bonus", emoji: "\u26A1", xp: XP.SPEED_BONUS, count: speedCount });
    }

    // 🔥 Hot Streak — every 3 consecutive first-attempt passes
    // Build ordered list of quizzes by first attempt date
    const firstAttempts = attempts
      .filter((a) => a.attempt_number === 1)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
    let streak = 0;
    let hotStreakCount = 0;
    for (const a of firstAttempts) {
      if (a.passed) {
        streak++;
        if (streak >= 3 && streak % 3 === 0) {
          hotStreakCount++;
        }
      } else {
        streak = 0;
      }
    }
    if (hotStreakCount > 0) {
      bonusXp += hotStreakCount * XP.HOT_STREAK;
      earnedBonuses.push({ id: "hotstreak", name: "Hot Streak", emoji: "\uD83D\uDD25", xp: XP.HOT_STREAK, count: hotStreakCount });
    }

    // 🧹 Clean Sweep — all 5 quizzes in a week passed on first attempt
    let cleanSweepCount = 0;
    for (const [, quizIds] of Object.entries(WEEK_QUIZZES)) {
      const allFirstAttemptPass = quizIds.every((qid) => firstAttemptResults[qid] === true);
      if (allFirstAttemptPass) cleanSweepCount++;
    }
    if (cleanSweepCount > 0) {
      bonusXp += cleanSweepCount * XP.CLEAN_SWEEP;
      earnedBonuses.push({ id: "cleansweep", name: "Clean Sweep", emoji: "\uD83E\uDDF9", xp: XP.CLEAN_SWEEP, count: cleanSweepCount });
    }

    // 💪 The Comeback — fail attempt 1, then score 10/10 on attempt 2
    let comebackCount = 0;
    for (const a of attempts) {
      if (
        a.attempt_number === 2 &&
        a.score === a.total_questions &&
        firstAttemptResults[a.quiz_id] === false
      ) {
        comebackCount++;
      }
    }
    if (comebackCount > 0) {
      bonusXp += comebackCount * XP.THE_COMEBACK;
      earnedBonuses.push({ id: "comeback", name: "The Comeback", emoji: "\uD83D\uDCAA", xp: XP.THE_COMEBACK, count: comebackCount });
    }

    // 📅 Same-Day Double — complete 2 quizzes in the same calendar day
    const dayMap = new Map<string, number>();
    for (const a of attempts) {
      const day = a.created_at.substring(0, 10); // YYYY-MM-DD
      dayMap.set(day, (dayMap.get(day) ?? 0) + 1);
    }
    // Count unique days with 2+ completions — but only count once per day
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

    // Determine tier
    const tier = TIERS.find((t) => totalXp >= t.min && totalXp <= t.max) ?? TIERS[0];

    // Get rank (how many users have more XP)
    const rankResult = await ctx.integrations.db.query(
      `WITH user_xp AS (
        SELECT user_email, COUNT(DISTINCT quiz_id)::int AS quizzes
        FROM camp_quiz_attempts
        GROUP BY user_email
      )
      SELECT COUNT(DISTINCT user_email)::int AS total_users
      FROM camp_quiz_attempts`,
      z.object({ total_users: z.number() }),
      undefined,
      { label: "Get total users for ranking" }
    );
    const totalUsers = rankResult[0]?.total_users ?? 1;
    // Simplified rank — will be computed properly on leaderboard
    const rank = 1; // Placeholder — real rank computed in leaderboard API

    return {
      totalXp,
      tier: { name: tier.name, emoji: tier.emoji, min: tier.min, max: tier.max },
      rank,
      totalUsers,
      quizzesCompleted: quizzesCompleted.size,
      pinnacleThreshold: PINNACLE_THRESHOLD,
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
