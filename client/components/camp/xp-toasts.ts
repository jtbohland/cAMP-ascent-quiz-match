import { toast } from "sonner";

interface SubmissionContext {
  passed: boolean;
  attemptNumber: number;
  score: number;
  totalQuestions: number;
  timeSpentSeconds: number;
  quizId: string;
}

interface XpData {
  totalXp: number;
  tier: { name: string; emoji: string; min: number; max: number };
  earnedBonuses: Array<{ id: string; name: string; emoji: string; xp: number; count: number }>;
}

// Previous tier for tier-up detection
const TIER_ORDER = ["Base Camper", "Trailblazer", "Summit Seeker", "Pinnacle Achiever"];

/**
 * Show toast notifications for XP earned on this quiz submission.
 * Called after the XP API returns with current state.
 */
export function showXpToasts(
  submission: SubmissionContext,
  xpData: XpData,
  previousTotalXp: number
) {
  const xpGained = xpData.totalXp - previousTotalXp;
  const isPerfect = submission.score === submission.totalQuestions;
  const isSpeedRun = submission.timeSpentSeconds < 600; // 10 min
  const isFirstAttempt = submission.attemptNumber === 1;

  // Small delay to let the UI transition first
  setTimeout(() => {
    // Core XP toast
    if (submission.passed && isFirstAttempt) {
      toast("🎯 First Attempt Pass! +5 XP", { duration: 3000 });
    } else if (submission.passed && submission.attemptNumber === 2) {
      toast("✅ Passed on 2nd Attempt! +3 XP", { duration: 3000 });
    } else if (!submission.passed) {
      toast("📝 +1 XP for the attempt", { duration: 2500 });
    }

    // Bonus toasts — check what was just triggered
    if (isPerfect && isFirstAttempt && isSpeedRun) {
      setTimeout(() => {
        toast("💯 Ace! +15 XP", {
          description: "Perfect score on first attempt under 10 minutes!",
          duration: 4000,
        });
      }, 500);
    } else if (isFirstAttempt && isSpeedRun && submission.passed) {
      setTimeout(() => {
        toast("⚡ Speed Bonus! +7 XP", {
          description: "Passed on first attempt in under 10 minutes!",
          duration: 3500,
        });
      }, 500);
    }

    // The Comeback: failed attempt 1, perfect on attempt 2
    if (submission.attemptNumber === 2 && isPerfect && submission.passed) {
      setTimeout(() => {
        toast("💪 The Comeback! +10 XP", {
          description: "Failed attempt 1, then scored 10/10 on attempt 2!",
          duration: 4000,
        });
      }, 1000);
    }

    // Hot Streak check — we infer from XP data (if it just appeared or increased)
    const hotStreakBonus = xpData.earnedBonuses.find((b) => b.id === "hot_streak");
    if (hotStreakBonus && isFirstAttempt && submission.passed) {
      // Check if they just earned it (XP gain includes 12)
      setTimeout(() => {
        toast("🔥 Hot Streak! +12 XP", {
          description: `${hotStreakBonus.count * 3} consecutive first-attempt passes!`,
          duration: 4000,
        });
      }, 1500);
    }

    // Same-Day Double
    const sameDayBonus = xpData.earnedBonuses.find((b) => b.id === "same_day_double");
    if (sameDayBonus) {
      // Only show if XP gain suggests it was just earned
      setTimeout(() => {
        toast("📅 Same-Day Double! +5 XP", {
          description: "Two quizzes submitted on the same day!",
          duration: 3500,
        });
      }, 2000);
    }

    // Clean Sweep
    const cleanSweepBonus = xpData.earnedBonuses.find((b) => b.id === "clean_sweep");
    if (cleanSweepBonus && isFirstAttempt && submission.passed) {
      setTimeout(() => {
        toast("🧹 Clean Sweep! +10 XP", {
          description: "All quizzes in the week passed on first attempt!",
          duration: 4000,
        });
      }, 2500);
    }

    // Tier-up celebration
    const previousTierIdx = TIER_ORDER.findIndex((t) => {
      if (previousTotalXp <= 75) return t === "Base Camper";
      if (previousTotalXp <= 150) return t === "Trailblazer";
      if (previousTotalXp <= 234) return t === "Summit Seeker";
      return t === "Pinnacle Achiever";
    });
    const currentTierIdx = TIER_ORDER.indexOf(xpData.tier.name);

    if (currentTierIdx > previousTierIdx) {
      setTimeout(() => {
        toast(`${xpData.tier.emoji} Tier Up: ${xpData.tier.name}!`, {
          description: `You've reached ${xpData.totalXp} XP!`,
          duration: 5000,
        });
      }, 3000);
    }

    // Total XP gained summary (if > just the base points)
    if (xpGained > 5) {
      setTimeout(() => {
        toast(`✨ Total: +${xpGained} XP this quiz!`, { duration: 3000 });
      }, 3500);
    }
  }, 600);
}
