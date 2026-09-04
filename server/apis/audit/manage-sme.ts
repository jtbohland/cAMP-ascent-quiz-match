import { api, z, postgres } from "@superblocksteam/sdk-api";

const APPS_DB = "c6e32cf4-ca66-42ae-aeb3-58c84ffae574";

export const AuditUpdateSme = api({
  name: "AuditUpdateSme",
  description: "Updates an SME's name and title on a quiz assignment",
  integrations: { apps_db: postgres(APPS_DB) },
  input: z.object({
    quizId: z.string(),
    oldSmeName: z.string(),
    newSmeName: z.string(),
    newSmeTitle: z.string(),
  }),
  output: z.object({ success: z.boolean() }),
  async run(ctx, { quizId, oldSmeName, newSmeName, newSmeTitle }) {
    await ctx.integrations.apps_db.execute(
      `UPDATE camp_quiz_audit_smes SET sme_name = $1, sme_title = $2 WHERE quiz_id = $3 AND sme_name = $4`,
      [newSmeName, newSmeTitle, quizId, oldSmeName],
      { label: `Update SME: ${oldSmeName} → ${newSmeName}` }
    );
    return { success: true };
  },
});

export const AuditRemoveSme = api({
  name: "AuditRemoveSme",
  description: "Removes an SME assignment from a quiz",
  integrations: { apps_db: postgres(APPS_DB) },
  input: z.object({
    quizId: z.string(),
    smeName: z.string(),
  }),
  output: z.object({ success: z.boolean() }),
  async run(ctx, { quizId, smeName }) {
    await ctx.integrations.apps_db.execute(
      `DELETE FROM camp_quiz_audit_smes WHERE quiz_id = $1 AND sme_name = $2`,
      [quizId, smeName],
      { label: `Remove SME: ${smeName} from ${quizId}` }
    );
    return { success: true };
  },
});
