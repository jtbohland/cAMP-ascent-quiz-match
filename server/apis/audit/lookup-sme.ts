import { api, z, postgres } from "@superblocksteam/sdk-api";

const APPS_DB = "c6e32cf4-ca66-42ae-aeb3-58c84ffae574";

const SmeAssignmentSchema = z.object({
  quiz_id: z.string(),
  quiz_topic: z.string(),
  sme_name: z.string(),
  sme_title: z.string(),
  is_registered: z.boolean(),
});

export default api({
  name: "AuditLookupSme",
  description: "Looks up an SME by email to check if they're in the roster",
  integrations: {
    apps_db: postgres(APPS_DB),
  },
  input: z.object({
    smeEmail: z.string().nullable(),
    smeName: z.string().nullable(),
  }),
  output: z.object({
    found: z.boolean(),
    isRegistered: z.boolean(),
    assignments: z.array(SmeAssignmentSchema),
  }),
  async run(ctx, { smeEmail, smeName }) {
    let assignments: z.infer<typeof SmeAssignmentSchema>[] = [];

    if (smeEmail) {
      assignments = await ctx.integrations.apps_db.query(
        `SELECT quiz_id, quiz_topic, sme_name, sme_title, is_registered
         FROM camp_quiz_audit_smes WHERE LOWER(sme_email) = LOWER($1) ORDER BY quiz_id`,
        SmeAssignmentSchema,
        [smeEmail],
        { label: "Lookup SME by email" }
      );
    }

    // If no email match, try by name
    if (assignments.length === 0 && smeName) {
      assignments = await ctx.integrations.apps_db.query(
        `SELECT quiz_id, quiz_topic, sme_name, sme_title, is_registered
         FROM camp_quiz_audit_smes WHERE LOWER(sme_name) = LOWER($1) ORDER BY quiz_id`,
        SmeAssignmentSchema,
        [smeName],
        { label: "Lookup SME by name" }
      );
    }

    return {
      found: assignments.length > 0,
      isRegistered: assignments.length > 0 && assignments[0].is_registered,
      assignments,
    };
  },
});
