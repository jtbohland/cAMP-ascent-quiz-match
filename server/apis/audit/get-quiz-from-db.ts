import { api, z, postgres } from "@superblocksteam/sdk-api";

const APPS_DB = "c6e32cf4-ca66-42ae-aeb3-58c84ffae574";

const QuestionSchema = z.object({
  question_index: z.coerce.number(),
  question_type: z.string(),
  lo: z.string().nullable(),
  question_text: z.string(),
  options: z.unknown().nullable(),
  correct_answer: z.unknown(),
  explanation: z.string().nullable(),
  placeholder: z.string().nullable(),
  pairs: z.unknown().nullable(),
  resource: z.unknown().nullable(),
});

const MetadataSchema = z.object({
  quiz_id: z.string(),
  day: z.string(),
  title: z.string(),
  week: z.string(),
  is_placeholder: z.boolean(),
});

export default api({
  name: "AuditGetQuizFromDb",
  description: "Fetches a quiz from the DB for learners (replaces static files)",
  integrations: {
    apps_db: postgres(APPS_DB),
  },
  input: z.object({ quizId: z.string() }),
  output: z.object({
    found: z.boolean(),
    quiz: z.object({
      id: z.string(),
      day: z.string(),
      title: z.string(),
      week: z.string(),
      isPlaceholder: z.boolean(),
      questions: z.array(z.object({
        id: z.number(),
        type: z.string(),
        lo: z.string(),
        text: z.string(),
        options: z.unknown().optional(),
        correct: z.unknown(),
        explanation: z.string(),
        placeholder: z.string().optional(),
        pairs: z.unknown().optional(),
        resource: z.unknown().optional(),
      })),
    }).nullable(),
  }),
  async run(ctx, { quizId }) {
    const metadata = await ctx.integrations.apps_db.query(
      `SELECT quiz_id, day, title, week, is_placeholder FROM camp_quiz_metadata WHERE quiz_id = $1 LIMIT 1`,
      MetadataSchema,
      [quizId],
      { label: "Fetch quiz metadata" }
    );

    if (metadata.length === 0) {
      return { found: false, quiz: null };
    }

    const meta = metadata[0];
    const questions = await ctx.integrations.apps_db.query(
      `SELECT question_index, question_type, lo, question_text, options, correct_answer, explanation, placeholder, pairs, resource
       FROM camp_quiz_questions_db WHERE quiz_id = $1 ORDER BY question_index`,
      QuestionSchema,
      [quizId],
      { label: "Fetch quiz questions" }
    );

    return {
      found: true,
      quiz: {
        id: meta.quiz_id,
        day: meta.day,
        title: meta.title,
        week: meta.week,
        isPlaceholder: meta.is_placeholder,
        questions: questions.map((q) => ({
          id: q.question_index,
          type: q.question_type,
          lo: q.lo ?? "",
          text: q.question_text,
          options: q.options ?? undefined,
          correct: q.correct_answer,
          explanation: q.explanation ?? "",
          placeholder: q.placeholder ?? undefined,
          pairs: q.pairs ?? undefined,
          resource: q.resource ?? undefined,
        })),
      },
    };
  },
});
