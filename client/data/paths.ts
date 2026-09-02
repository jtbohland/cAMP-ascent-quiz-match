/**
 * Multi-path configuration for cAMP Ascent: Sales
 *
 * Three learner paths:
 * - AE (Account Executive): 15 quizzes — the original/default path
 * - SDR (Sales Development Rep): 11 quizzes — shares most AE quizzes + 1 SDR-exclusive
 * - Promo (SDR → Velocity AE Promotion): 7 quizzes — subset of AE path for role transitions
 */

export type PathId = "ae" | "sdr" | "promo";

export interface PathConfig {
  id: PathId;
  label: string;
  emoji: string;
  description: string;
  /** Ordered quiz IDs — passing quiz N unlocks quiz N+1 */
  quizOrder: readonly string[];
  /** Week groupings for display sections and Clean Sweep bonus */
  weekGroups: Record<string, readonly string[]>;
  /** Week display labels with emojis */
  weekLabels: { key: string; label: string; emoji: string }[];
  /** Tier thresholds (scaled proportionally from AE baseline) */
  tiers: readonly { min: number; max: number; name: string; emoji: string }[];
  /** First-attempt-pass milestones for milestone bonuses */
  milestones: readonly number[];
  /** Pinnacle threshold (top tier minimum) */
  pinnacleThreshold: number;
  /** Theoretical maximum XP achievable on this path */
  maxXp: number;
}

// ─── AE Path (15 quizzes) ─── baseline ───
const AE_PATH: PathConfig = {
  id: "ae",
  label: "AE Path",
  emoji: "🎯",
  description: "Account Executive — the full 15-quiz Ascent",
  quizOrder: [
    "day1", "day2", "day3", "day4", "day5",
    "day6", "day7", "day8", "day9", "day10",
    "day11", "day12", "day13", "day14", "day15",
  ],
  weekGroups: {
    "Week 2": ["day1", "day2", "day3", "day4", "day5"],
    "Week 3": ["day6", "day7", "day8", "day9", "day10"],
    "Week 4": ["day11", "day12", "day13", "day14", "day15"],
  },
  weekLabels: [
    { key: "Week 2", label: "Week 2", emoji: "🥾" },
    { key: "Week 3", label: "Week 3", emoji: "🏞️" },
    { key: "Week 4", label: "Week 4", emoji: "🧗🏻‍♂️" },
  ],
  tiers: [
    { min: 0, max: 75, name: "Base Camper", emoji: "🏕️" },
    { min: 76, max: 150, name: "Trailblazer", emoji: "🥾" },
    { min: 151, max: 234, name: "Summit Seeker", emoji: "🧗🏼" },
    { min: 235, max: 9999, name: "Pinnacle Achiever", emoji: "🏔️✨" },
  ],
  milestones: [5, 10, 15],
  pinnacleThreshold: 235,
  maxXp: 620,
};

// ─── SDR Path (11 quizzes) ─── ~73% scale ───
const SDR_PATH: PathConfig = {
  id: "sdr",
  label: "SDR Path",
  emoji: "📞",
  description: "Sales Development Rep — 11 quizzes tailored for SDRs",
  quizOrder: [
    "day1", "day2", "day3", "day4", "sdr-cold-calling",
    "day6", "day7", "day8", "day9", "day10",
    "day12",
  ],
  weekGroups: {
    "Week 2": ["day1", "day2", "day3", "day4", "sdr-cold-calling"],
    "Week 3": ["day6", "day7", "day8", "day9", "day10"],
    "Week 4": ["day12"],
  },
  weekLabels: [
    { key: "Week 2", label: "Week 2", emoji: "🥾" },
    { key: "Week 3", label: "Week 3", emoji: "🏞️" },
    { key: "Week 4", label: "Week 4", emoji: "🧗🏻‍♂️" },
  ],
  tiers: [
    { min: 0, max: 55, name: "Base Camper", emoji: "🏕️" },
    { min: 56, max: 110, name: "Trailblazer", emoji: "🥾" },
    { min: 111, max: 171, name: "Summit Seeker", emoji: "🧗🏼" },
    { min: 172, max: 9999, name: "Pinnacle Achiever", emoji: "🏔️✨" },
  ],
  milestones: [4, 7, 11],
  pinnacleThreshold: 172,
  maxXp: 466,
};

// ─── Promo Path (7 quizzes) ─── ~47% scale ───
const PROMO_PATH: PathConfig = {
  id: "promo",
  label: "Promo Path",
  emoji: "🚀",
  description: "SDR → Velocity AE Promotion — 7 key quizzes for role transitions",
  quizOrder: [
    "day5", "day9", "day10", "day11", "day13",
    "day14", "day15",
  ],
  weekGroups: {
    "Week 2": ["day5", "day9", "day10", "day11", "day13"],
    "Week 3": ["day14", "day15"],
  },
  weekLabels: [
    { key: "Week 2", label: "Week 2", emoji: "🥾" },
    { key: "Week 3", label: "Week 3", emoji: "🏞️" },
  ],
  tiers: [
    { min: 0, max: 35, name: "Base Camper", emoji: "🏕️" },
    { min: 36, max: 71, name: "Trailblazer", emoji: "🥾" },
    { min: 72, max: 110, name: "Summit Seeker", emoji: "🧗🏼" },
    { min: 111, max: 9999, name: "Pinnacle Achiever", emoji: "🏔️✨" },
  ],
  milestones: [2, 5, 7],
  pinnacleThreshold: 111,
  maxXp: 314,
};

// ─── Exports ───

export const PATHS: Record<PathId, PathConfig> = {
  ae: AE_PATH,
  sdr: SDR_PATH,
  promo: PROMO_PATH,
};

/** All paths as an array for iteration */
export const ALL_PATHS: PathConfig[] = [AE_PATH, SDR_PATH, PROMO_PATH];

/** The role string used at registration for the Promo path */
export const PROMO_ROLE = "SDR → Velocity AE Promo";

/** Map a registration role string to a path ID */
export function getRolePathId(role: string): PathId {
  if (role === "SDR") return "sdr";
  if (role === PROMO_ROLE) return "promo";
  return "ae"; // Velocity AE, Emerging AE, Majors AE, Strat AE, PSM, Renewals, Admin → AE
}

/** Get path config for a role string */
export function getPathForRole(role: string): PathConfig {
  return PATHS[getRolePathId(role)];
}

/** Get path config by path ID */
export function getPathById(pathId: PathId): PathConfig {
  return PATHS[pathId];
}
