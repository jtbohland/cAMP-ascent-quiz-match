import { api, z, postgres } from "@superblocksteam/sdk-api";

const APPS_DB = "c6e32cf4-ca66-42ae-aeb3-58c84ffae574";

export default api({
  name: "AuditAddNote",
  description: "Adds a note to a quiz audit thread",
  integrations: {
    apps_db: postgres(APPS_DB),
  },
  input: z.object({
    quizId: z.string(),
    authorName: z.string(),
    authorEmail: z.string(),
    noteText: z.string(),
  }),
  output: z.object({ success: z.boolean(), noteId: z.coerce.number() }),
  async run(ctx, { quizId, authorName, authorEmail, noteText }) {
    const IdSchema = z.object({ id: z.coerce.number() });
    const [{ id }] = await ctx.integrations.apps_db.query(
      `INSERT INTO camp_quiz_audit_notes (quiz_id, author_name, author_email, note_text)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      IdSchema,
      [quizId, authorName, authorEmail, noteText],
      { label: "Add audit note" }
    );
    return { success: true, noteId: id };
  },
});
