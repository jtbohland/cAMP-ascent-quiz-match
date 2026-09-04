/**
 * Hook to fetch quiz data with DB-first, static-fallback strategy.
 * Once quiz content is migrated to the DB, SME edits go live instantly.
 * Falls back to static TS files if the DB has no data yet.
 */
import { useMemo } from "react";
import { useApiData } from "@/hooks/useApiData.js";
import { getQuizById } from "@/data/quizzes/index.js";
import type { Quiz } from "@/data/quiz-types.js";

export function useQuizFromDb(quizId: string | undefined) {
  const { data, loading } = useApiData(
    "AuditGetQuizFromDb",
    { quizId: quizId ?? "" },
    { enabled: !!quizId }
  );

  const quiz: Quiz | undefined = useMemo(() => {
    // If DB returned data, use it
    if (data?.found && data.quiz) {
      return {
        id: data.quiz.id,
        day: data.quiz.day,
        title: data.quiz.title,
        week: data.quiz.week,
        isPlaceholder: data.quiz.isPlaceholder,
        questions: (data.quiz.questions as Array<{
          id: number;
          type: string;
          lo: string;
          text: string;
          options?: unknown;
          correct: unknown;
          explanation: string;
          placeholder?: string;
          pairs?: unknown;
          resource?: unknown;
        }>).map((q) => ({
          id: q.id,
          type: q.type as "mc" | "tf" | "fill" | "match",
          lo: q.lo,
          text: q.text,
          options: Array.isArray(q.options) ? q.options as string[] : undefined,
          correct: q.correct as number | string[],
          explanation: q.explanation,
          placeholder: q.placeholder,
          pairs: Array.isArray(q.pairs)
            ? (q.pairs as Array<{ term: string; match: string }>)
            : undefined,
          resource: q.resource as { label: string; url: string } | undefined,
        })),
      };
    }

    // Fallback to static
    if (!loading && quizId) {
      return getQuizById(quizId);
    }

    return undefined;
  }, [data, loading, quizId]);

  return { quiz, loading };
}
