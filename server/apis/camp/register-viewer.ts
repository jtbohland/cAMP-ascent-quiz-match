import { api, z, postgres } from "@superblocksteam/sdk-api";

const APPS_DB = "c6e32cf4-ca66-42ae-aeb3-58c84ffae574";

const ViewerSchema = z.object({
  id: z.coerce.number(),
  user_name: z.string(),
  user_email: z.string(),
  user_role: z.string(),
  manager_name: z.string(),
  manager_email: z.string().nullable(),
  region: z.string(),
  ascent_day1: z.string(),
  welcome_seen: z.boolean(),
});

export default api({
  name: "CampRegisterViewer",
  description: "Registers a new cAMP viewer or returns existing viewer record.",

  integrations: {
    db: postgres(APPS_DB),
  },

  input: z.object({
    userName: z.string(),
    userEmail: z.string(),
    userRole: z.string(),
    managerName: z.string(),
    managerEmail: z.string().nullable(),
    region: z.string(),
    ascentDay1: z.string(),
  }),

  output: z.object({
    viewer: ViewerSchema,
    isNew: z.boolean(),
  }),

  async run(ctx, { userName, userEmail, userRole, managerName, managerEmail, region, ascentDay1 }) {
    // Ensure table exists
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

    // Check if viewer already exists
    const existing = await ctx.integrations.db.query(
      "SELECT id, user_name, user_email, user_role, manager_name, manager_email, region, ascent_day1::text, welcome_seen FROM camp_viewers WHERE LOWER(user_email) = LOWER($1) LIMIT 1",
      ViewerSchema,
      [userEmail],
      { label: "Check existing viewer" }
    );

    if (existing.length > 0) {
      return { viewer: existing[0], isNew: false };
    }

    // Insert new viewer
    const inserted = await ctx.integrations.db.query(
      `INSERT INTO camp_viewers (user_name, user_email, user_role, manager_name, manager_email, region, ascent_day1)
       VALUES ($1, $2, $3, $4, $5, $6, $7::date)
       RETURNING id, user_name, user_email, user_role, manager_name, manager_email, region, ascent_day1::text, welcome_seen`,
      ViewerSchema,
      [userName, userEmail, userRole, managerName, managerEmail, region, ascentDay1],
      { label: "Insert new viewer" }
    );

    return { viewer: inserted[0], isNew: true };
  },
});
