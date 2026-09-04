import { api, z, postgres } from "@superblocksteam/sdk-api";

const APPS_DB = "c6e32cf4-ca66-42ae-aeb3-58c84ffae574";

export default api({
  name: "AuditSaveQuestionEdit",
  description: "Saves a question edit and logs the change",
  integrations: {
    apps_db: postgres(APPS_DB),
  },
  input: z.object({
    questionDbId: z.number(),
    quizId: z.string(),
    questionIndex: z.number(),
    field: z.string(),
    oldValue: z.string().nullable(),
    newValue: z.string(),
    smeName: z.string(),
    smeEmail: z.string(),
  }),
  output: z.object({ success: z.boolean() }),
  async run(ctx, { questionDbId, quizId, questionIndex, field, oldValue, newValue, smeName, smeEmail }) {
    // Build dynamic update
    const fieldMap: Record<string, string> = {
      question_text: "question_text",
      options: "options",
      correct_answer: "correct_answer",
      explanation: "explanation",
    };

    const dbField = fieldMap[field];
    if (!dbField) throw new Error(`Invalid field: ${field}`);

    // For options and correct_answer, store as JSONB
    const isJsonField = field === "options" || field === "correct_answer";
    const paramValue = isJsonField ? newValue : newValue;

    await ctx.integrations.apps_db.execute(
      `UPDATE camp_quiz_questions_db SET ${dbField} = ${isJsonField ? "$1::jsonb" : "$1"}, updated_at = NOW() WHERE id = $2`,
      [paramValue, questionDbId],
      { label: `Update question ${questionIndex} field: ${field}` }
    );

    // Log the edit
    await ctx.integrations.apps_db.execute(
      `INSERT INTO camp_quiz_audit_edits (quiz_id, question_id, sme_name, sme_email, field_changed, old_value, new_value)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [quizId, questionIndex, smeName, smeEmail, field, oldValue, newValue],
      { label: "Log question edit" }
    );

    return { success: true };
  },
});
