export type QuestionType = "mc" | "tf" | "fill" | "match";

export type Question = {
  id: number;
  type: QuestionType;
  lo: string;
  text: string;
  options?: string[];
  correct: number | string[];
  explanation: string;
  placeholder?: string;
  pairs?: { term: string; match: string }[];
  resource?: { label: string; url: string };
};

export type Quiz = {
  id: string;
  day: string;
  title: string;
  week: string;
  questions: Question[];
};

export const ROLES = [
  "SDR",
  "Velocity AE",
  "Emerging Ent AE",
  "Enterprise AE",
  "Strategic AE",
  "PSM",
  "Renewals",
] as const;

export type Role = (typeof ROLES)[number];

export const PASS_THRESHOLD = 80;
export const TOTAL_TIME_SECONDS = 1080; // 18 minutes
export const MAX_ATTEMPTS = 4;
