import type { Quiz } from "../quiz-types.js";
import { week2Quizzes } from "./week2.js";
import { week3Quizzes } from "./week3.js";
import { week4Quizzes } from "./week4.js";

export const QUIZZES: Quiz[] = [
  ...week2Quizzes,
  ...week3Quizzes,
  ...week4Quizzes,
];

export function getQuizById(id: string): Quiz | undefined {
  return QUIZZES.find((q) => q.id === id);
}

export function getQuizzesByWeek(week: string): Quiz[] {
  return QUIZZES.filter((q) => q.week === week);
}

export const WEEKS = ["Week 2", "Week 3", "Week 4"] as const;

/** Ordered quiz IDs — passing quiz N unlocks quiz N+1 */
export const QUIZ_ORDER = [
  "day1", "day2", "day3", "day4", "day5",
  "day6", "day7", "day8", "day9", "day10",
  "day11", "day12", "day13", "day14", "day15",
] as const;

/** Emojis for each quiz title */
export const QUIZ_EMOJIS: Record<string, string> = {
  day1: "🔎",   // ICP: Personas & Industries
  day2: "📥",   // TOFU – MQLs & Inbounds
  day3: "📈",   // GTM Launch Pad
  day4: "📇",   // Prospecting Process
  day5: "🐦‍🔥",  // Renewal Operations
  day6: "🥊",   // The Competitive Landscape
  day7: "🩺",   // Account Planning Best Practices
  day8: "🏎️",   // Discovery That Accelerates
  day9: "💰",   // Pricing & Packaging 101
  day10: "🪢",  // Leveraging Partners
  day11: "☂️",  // Forecasting (including Services)
  day12: "📖",  // Customer Stories
  day13: "📑",  // Contract Lifecycle Management
  day14: "🤝",  // Deal Desk & CPQ
  day15: "🪢",  // Leveraging SEs & Professional Services
};
