import { api, z, postgres } from "@superblocksteam/sdk-api";

const APPS_DB = "c6e32cf4-ca66-42ae-aeb3-58c84ffae574";

const ViewerSchema = z.object({
  id: z.coerce.number(),
  user_name: z.string(),
  user_email: z.string(),
  user_role: z.string(),
  manager_name: z.string(),
  manager_email: z.string().nullable(),
  ascent_day1: z.string(),
  welcome_seen: z.boolean(),
});

export default api({
  name: "CampLookupViewer",
  description: "Looks up a viewer by email to check registration status.",

  integrations: {
    db: postgres(APPS_DB),
  },

  input: z.object({
    userEmail: z.string(),
  }),

  output: z.object({
    viewer: ViewerSchema.nullable(),
    isRegistered: z.boolean(),
  }),

  async run(ctx, { userEmail }) {
    // Ensure table exists (idempotent)
    await ctx.integrations.db.execute(
      `CREATE TABLE IF NOT EXISTS camp_viewers (
        id SERIAL PRIMARY KEY,
        user_name TEXT NOT NULL,
        user_email TEXT NOT NULL UNIQUE,
        user_role TEXT NOT NULL,
        manager_name TEXT NOT NULL,
        manager_email TEXT,
        ascent_day1 DATE NOT NULL DEFAULT CURRENT_DATE,
        welcome_seen BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      undefined,
      { label: "Ensure camp_viewers table exists" }
    );

    const viewers = await ctx.integrations.db.query(
      "SELECT id, user_name, user_email, user_role, manager_name, manager_email, ascent_day1::text, welcome_seen FROM camp_viewers WHERE LOWER(user_email) = LOWER($1) LIMIT 1",
      ViewerSchema,
      [userEmail],
      { label: "Lookup viewer by email" }
    );

    if (viewers.length > 0) {
      return { viewer: viewers[0], isRegistered: true };
    }

    // Fallback: user isn't in camp_viewers, but may have prior quiz attempts
    // with a role recorded. Use that so the quiz button isn't permanently disabled.
    const fallbackRole = await ctx.integrations.db.query(
      "SELECT user_role FROM camp_quiz_attempts WHERE LOWER(user_email) = LOWER($1) ORDER BY id DESC LIMIT 1",
      z.object({ user_role: z.string() }),
      [userEmail],
      { label: "Fallback role from prior attempts" }
    );

    if (fallbackRole.length > 0) {
      return {
        viewer: {
          id: 0,
          user_name: "",
          user_email: userEmail,
          user_role: fallbackRole[0].user_role,
          manager_name: "",
          manager_email: null,
          ascent_day1: new Date().toISOString().split("T")[0],
          welcome_seen: true,
        },
        isRegistered: false,
      };
    }

    return { viewer: null, isRegistered: false };
  },
});
