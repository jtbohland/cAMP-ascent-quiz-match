import { api, z, postgres } from "@superblocksteam/sdk-api";

const APPS_DB = "c6e32cf4-ca66-42ae-aeb3-58c84ffae574";

export default api({
  name: "AuditSetupTables",
  description: "Creates all audit system tables and seeds SME roster",
  integrations: {
    apps_db: postgres(APPS_DB),
  },
  input: z.object({}),
  output: z.object({ success: z.boolean(), message: z.string() }),
  async run(ctx) {
    // 1. Quiz content stored in DB (migrated from static TS files)
    await ctx.integrations.apps_db.execute(
      `CREATE TABLE IF NOT EXISTS camp_quiz_questions_db (
        id SERIAL PRIMARY KEY,
        quiz_id TEXT NOT NULL,
        question_index INT NOT NULL,
        question_type TEXT NOT NULL,
        lo TEXT,
        question_text TEXT NOT NULL,
        options JSONB,
        correct_answer JSONB NOT NULL,
        explanation TEXT,
        placeholder TEXT,
        pairs JSONB,
        resource JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )`,
      undefined,
      { label: "Create quiz questions table" }
    );

    // 2. Quiz metadata (title, day, week, etc.)
    await ctx.integrations.apps_db.execute(
      `CREATE TABLE IF NOT EXISTS camp_quiz_metadata (
        quiz_id TEXT PRIMARY KEY,
        day TEXT NOT NULL,
        title TEXT NOT NULL,
        week TEXT NOT NULL,
        is_placeholder BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )`,
      undefined,
      { label: "Create quiz metadata table" }
    );

    // 3. SME roster with quiz assignments
    await ctx.integrations.apps_db.execute(
      `CREATE TABLE IF NOT EXISTS camp_quiz_audit_smes (
        id SERIAL PRIMARY KEY,
        sme_name TEXT NOT NULL,
        sme_title TEXT NOT NULL,
        sme_email TEXT,
        quiz_id TEXT NOT NULL,
        quiz_topic TEXT NOT NULL,
        is_registered BOOLEAN DEFAULT FALSE,
        registered_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`,
      undefined,
      { label: "Create SME roster table" }
    );

    // 4. Audit edit log (change tracking)
    await ctx.integrations.apps_db.execute(
      `CREATE TABLE IF NOT EXISTS camp_quiz_audit_edits (
        id SERIAL PRIMARY KEY,
        quiz_id TEXT NOT NULL,
        question_id INT NOT NULL,
        sme_name TEXT NOT NULL,
        sme_email TEXT NOT NULL,
        field_changed TEXT NOT NULL,
        old_value TEXT,
        new_value TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`,
      undefined,
      { label: "Create audit edits log table" }
    );

    // 5. Notes thread per quiz
    await ctx.integrations.apps_db.execute(
      `CREATE TABLE IF NOT EXISTS camp_quiz_audit_notes (
        id SERIAL PRIMARY KEY,
        quiz_id TEXT NOT NULL,
        author_name TEXT NOT NULL,
        author_email TEXT NOT NULL,
        note_text TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`,
      undefined,
      { label: "Create audit notes table" }
    );

    // 6. cAMP Gear review checkboxes
    await ctx.integrations.apps_db.execute(
      `CREATE TABLE IF NOT EXISTS camp_quiz_audit_gear_reviews (
        id SERIAL PRIMARY KEY,
        quiz_id TEXT NOT NULL,
        gear_label TEXT NOT NULL,
        reviewed_by TEXT NOT NULL,
        reviewed_at TIMESTAMPTZ DEFAULT NOW()
      )`,
      undefined,
      { label: "Create gear reviews table" }
    );

    // 7. Question approval tracking
    await ctx.integrations.apps_db.execute(
      `CREATE TABLE IF NOT EXISTS camp_quiz_audit_question_approvals (
        id SERIAL PRIMARY KEY,
        quiz_id TEXT NOT NULL,
        question_id INT NOT NULL,
        approved_by TEXT NOT NULL,
        approved_at TIMESTAMPTZ DEFAULT NOW()
      )`,
      undefined,
      { label: "Create question approvals table" }
    );

    // 8. Sign-offs
    await ctx.integrations.apps_db.execute(
      `CREATE TABLE IF NOT EXISTS camp_quiz_audit_signoffs (
        id SERIAL PRIMARY KEY,
        quiz_id TEXT NOT NULL,
        sme_name TEXT NOT NULL,
        sme_email TEXT NOT NULL,
        notes TEXT,
        signed_at TIMESTAMPTZ DEFAULT NOW()
      )`,
      undefined,
      { label: "Create sign-offs table" }
    );

    return { success: true, message: "All audit tables created successfully" };
  },
});
