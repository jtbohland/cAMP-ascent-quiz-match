import { api, z, postgres } from "@superblocksteam/sdk-api";

const APPS_DB = "c6e32cf4-ca66-42ae-aeb3-58c84ffae574";

const QuestionSchema = z.object({
  id: z.coerce.number(),
  quiz_id: z.string(),
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

const NoteSchema = z.object({
  id: z.coerce.number(),
  author_name: z.string(),
  author_email: z.string(),
  note_text: z.string(),
  created_at: z.string(),
});

const EditSchema = z.object({
  id: z.coerce.number(),
  question_id: z.coerce.number(),
  sme_name: z.string(),
  field_changed: z.string(),
  old_value: z.string().nullable(),
  new_value: z.string().nullable(),
  created_at: z.string(),
});

const ApprovalSchema = z.object({
  question_id: z.coerce.number(),
  approved_by: z.string(),
  approved_at: z.string(),
});

const GearReviewSchema = z.object({
  gear_label: z.string(),
  reviewed_by: z.string(),
  reviewed_at: z.string(),
});

const SignoffSchema = z.object({
  sme_name: z.string(),
  notes: z.string().nullable(),
  signed_at: z.string(),
});

const SmeSchema = z.object({
  sme_name: z.string(),
  sme_title: z.string(),
  sme_email: z.string().nullable(),
  is_registered: z.boolean(),
});

export default api({
  name: "AuditGetQuizDetail",
  description: "Fetches full quiz detail for the audit view",
  integrations: {
    apps_db: postgres(APPS_DB),
  },
  input: z.object({ quizId: z.string() }),
  output: z.object({
    questions: z.array(QuestionSchema),
    notes: z.array(NoteSchema),
    edits: z.array(EditSchema),
    approvals: z.array(ApprovalSchema),
    gearReviews: z.array(GearReviewSchema),
    signoffs: z.array(SignoffSchema),
    smes: z.array(SmeSchema),
  }),
  async run(ctx, { quizId }) {
    const [questions, notes, edits, approvals, gearReviews, signoffs, smes] = await Promise.all([
      ctx.integrations.apps_db.query(
        `SELECT id, quiz_id, question_index, question_type, lo, question_text, options, correct_answer, explanation, placeholder, pairs, resource
         FROM camp_quiz_questions_db WHERE quiz_id = $1 ORDER BY question_index`,
        QuestionSchema,
        [quizId],
        { label: "Fetch quiz questions" }
      ),
      ctx.integrations.apps_db.query(
        `SELECT id, author_name, author_email, note_text, created_at::TEXT
         FROM camp_quiz_audit_notes WHERE quiz_id = $1 ORDER BY created_at DESC LIMIT 50`,
        NoteSchema,
        [quizId],
        { label: "Fetch audit notes" }
      ),
      ctx.integrations.apps_db.query(
        `SELECT id, question_id, sme_name, field_changed, old_value, new_value, created_at::TEXT
         FROM camp_quiz_audit_edits WHERE quiz_id = $1 ORDER BY created_at DESC LIMIT 50`,
        EditSchema,
        [quizId],
        { label: "Fetch edit history" }
      ),
      ctx.integrations.apps_db.query(
        `SELECT question_id, approved_by, approved_at::TEXT
         FROM camp_quiz_audit_question_approvals WHERE quiz_id = $1`,
        ApprovalSchema,
        [quizId],
        { label: "Fetch question approvals" }
      ),
      ctx.integrations.apps_db.query(
        `SELECT gear_label, reviewed_by, reviewed_at::TEXT
         FROM camp_quiz_audit_gear_reviews WHERE quiz_id = $1`,
        GearReviewSchema,
        [quizId],
        { label: "Fetch gear reviews" }
      ),
      ctx.integrations.apps_db.query(
        `SELECT sme_name, notes, signed_at::TEXT
         FROM camp_quiz_audit_signoffs WHERE quiz_id = $1`,
        SignoffSchema,
        [quizId],
        { label: "Fetch sign-offs" }
      ),
      ctx.integrations.apps_db.query(
        `SELECT sme_name, sme_title, sme_email, is_registered
         FROM camp_quiz_audit_smes WHERE quiz_id = $1 ORDER BY sme_name`,
        SmeSchema,
        [quizId],
        { label: "Fetch assigned SMEs" }
      ),
    ]);

    return { questions, notes, edits, approvals, gearReviews, signoffs, smes };
  },
});
