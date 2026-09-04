import { api, z, postgres } from "@superblocksteam/sdk-api";
import { QUIZZES } from "../../data/quizzes/index.js";

const APPS_DB = "c6e32cf4-ca66-42ae-aeb3-58c84ffae574";

/** Valid quiz IDs that actually exist in the app */
const VALID_QUIZ_IDS = new Set(QUIZZES.map((q) => q.id));

/** SME roster — only entries with valid quiz IDs */
const SME_ROSTER = [
  { name: "Michele Morales", title: "Group Product Marketing Manager", topic: "Ideal Customer Profiles", quizId: "day1" },
  { name: "Swati Teerdhala", title: "Sr. Product Marketing Manager", topic: "Ideal Customer Profiles", quizId: "day1" },
  { name: "Nathan Youmans", title: "Director, Marketing Operations", topic: "Top of Funnel (TOFU) – MQLs & Inbounds", quizId: "day2" },
  { name: "Chelsie Cauthon", title: "Senior Marketing Transformation Manager", topic: "Top of Funnel (TOFU) – MQLs & Inbounds", quizId: "day2" },
  { name: "Matt Kahan", title: "Senior Manager GTM Strategy & Analytics", topic: "GTM Launch Pad & Pod Tower", quizId: "day3" },
  { name: "Simon Levison", title: "Senior Solutions Lead", topic: "GTM Launch Pad & Pod Tower", quizId: "day3" },
  { name: "Hugo S. Robein", title: "Director, Sales Operations", topic: "GTM Launch Pad & Pod Tower", quizId: "day3" },
  { name: "JT Bohland", title: "Sr. Enablement Program Manager, Global Sales", topic: "Prospecting Process", quizId: "day4" },
  { name: "Katie Helie", title: "Vice President, Finance", topic: "Renewal Operations", quizId: "day5" },
  { name: "Lenora Bennis", title: "Senior Manager, Renewals Management", topic: "Renewal Operations", quizId: "day5" },
  { name: "Megha Sisaudia", title: "Head of Pricing Strategy & Operations", topic: "Renewal Operations", quizId: "day5" },
  { name: "Lauren Hargarten", title: "Senior Sales Development Manager", topic: "Cold Calling & Making Calls with Nooks", quizId: "sdr-cold-calling" },
  { name: "Halle Morris", title: "Sales Development Manager", topic: "Cold Calling & Making Calls with Nooks", quizId: "sdr-cold-calling" },
  { name: "Darshil Gandhi", title: "Director, Product Marketing", topic: "The Competitive Landscape", quizId: "day6" },
  { name: "Alicia Chang", title: "Product Marketing Manager, Marketing Solutions", topic: "The Competitive Landscape", quizId: "day6" },
  { name: "Swati Teerdhala", title: "Sr. Product Marketing Manager", topic: "The Competitive Landscape", quizId: "day6" },
  { name: "Simon Levison", title: "Senior Solutions Lead", topic: "Account Planning", quizId: "day7" },
  { name: "Hugo S. Robein", title: "Director, Sales Operations", topic: "Account Planning", quizId: "day7" },
  { name: "JT Bohland", title: "Sr. Enablement Program Manager, Global Sales", topic: "Discovery That Accelerates", quizId: "day8" },
  { name: "Megha Sisaudia", title: "Head of Pricing Strategy & Operations", topic: "Pricing & Packaging 101", quizId: "day9" },
  { name: "Katie Helie", title: "Vice President, Finance", topic: "Pricing & Packaging 101", quizId: "day9" },
  { name: "Kyle Helstad", title: "Sales Finance Director", topic: "Pricing & Packaging 101", quizId: "day9" },
  { name: "Nick Iyengar", title: "Head Of Global Partner Sales", topic: "Leveraging Partners", quizId: "day10" },
  { name: "Perri O'Brien", title: "Partner Sales Manager", topic: "Leveraging Partners", quizId: "day10" },
  { name: "Jaimie Taketa", title: "Partner Sales Manager", topic: "Leveraging Partners", quizId: "day10" },
  { name: "Corey Gibbel", title: "Sales Strategy & Operations Manager", topic: "Forecasting, including Services", quizId: "day11" },
  { name: "Ganit Bar-Dor", title: "Sr. Director, Customer Success", topic: "Forecasting, including Services", quizId: "day11" },
  { name: "Hugo S. Robein", title: "Director, Sales Operations", topic: "Forecasting, including Services", quizId: "day11" },
  { name: "JT Bohland", title: "Sr. Enablement Program Manager, Global Sales", topic: "Customer Stories", quizId: "day12" },
  { name: "Craig Rudrud", title: "Staff Systems Engineer", topic: "Contract Lifecycle Management", quizId: "day13" },
  { name: "Joy Udom", title: "Director, Associate General Council", topic: "Contract Lifecycle Management", quizId: "day13" },
  { name: "Sarah Simmons", title: "Legal Operations Manager", topic: "Contract Lifecycle Management", quizId: "day13" },
  { name: "Skyla Banks", title: "Associate General Counsel, Commercial", topic: "Contract Lifecycle Management", quizId: "day13" },
  { name: "Matt Murray", title: "Director, Sales Finance", topic: "Deal Desk & CPQ", quizId: "day14" },
  { name: "Katie Helie", title: "Vice President, Finance", topic: "Deal Desk & CPQ", quizId: "day14" },
  { name: "Megha Sisaudia", title: "Head of Pricing Strategy & Operations", topic: "Deal Desk & CPQ", quizId: "day14" },
  { name: "Erin Del Mundo", title: "Deal Desk Manager", topic: "Deal Desk & CPQ", quizId: "day14" },
  { name: "Jessica Adona", title: "Deal Desk Manager", topic: "Deal Desk & CPQ", quizId: "day14" },
  { name: "Taylor Wolfe", title: "GTM Enablement Program Manager", topic: "Leveraging SEs & Professional Services", quizId: "day15" },
  { name: "Ganit Bar-Dor", title: "Sr. Director, Customer Success", topic: "Leveraging SEs & Professional Services", quizId: "day15" },
].filter((sme) => VALID_QUIZ_IDS.has(sme.quizId));

export default api({
  name: "AuditSeedAllData",
  description: "Seeds all quiz content from static files and SME roster into DB",
  integrations: {
    apps_db: postgres(APPS_DB),
  },
  input: z.object({}),
  output: z.object({ success: z.boolean(), quizzesSeeded: z.number(), questionsSeeded: z.number(), smesSeeded: z.number() }),
  async run(ctx) {
    let questionsSeeded = 0;

    // Clear existing data first (idempotent re-seed)
    await ctx.integrations.apps_db.execute(
      `DELETE FROM camp_quiz_questions_db WHERE 1=1`,
      undefined,
      { label: "Clear existing questions" }
    );
    await ctx.integrations.apps_db.execute(
      `DELETE FROM camp_quiz_metadata WHERE 1=1`,
      undefined,
      { label: "Clear existing metadata" }
    );
    await ctx.integrations.apps_db.execute(
      `DELETE FROM camp_quiz_audit_smes WHERE 1=1`,
      undefined,
      { label: "Clear existing SME roster" }
    );

    // Seed quiz metadata + questions from static files
    for (const quiz of QUIZZES) {
      if (quiz.isPlaceholder) continue;

      await ctx.integrations.apps_db.execute(
        `INSERT INTO camp_quiz_metadata (quiz_id, day, title, week, is_placeholder)
         VALUES ($1, $2, $3, $4, $5)`,
        [quiz.id, quiz.day, quiz.title, quiz.week, quiz.isPlaceholder ?? false],
        { label: `Seed metadata: ${quiz.id}` }
      );

      for (const q of quiz.questions) {
        await ctx.integrations.apps_db.execute(
          `INSERT INTO camp_quiz_questions_db (quiz_id, question_index, question_type, lo, question_text, options, correct_answer, explanation, placeholder, pairs, resource)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            quiz.id,
            q.id,
            q.type,
            q.lo,
            q.text,
            q.options ? JSON.stringify(q.options) : null,
            JSON.stringify(q.correct),
            q.explanation,
            q.placeholder ?? null,
            q.pairs ? JSON.stringify(q.pairs) : null,
            q.resource ? JSON.stringify(q.resource) : null,
          ],
          { label: `Seed Q${q.id} for ${quiz.id}` }
        );
        questionsSeeded++;
      }
    }

    // Seed SME roster (only valid quiz IDs)
    for (const sme of SME_ROSTER) {
      await ctx.integrations.apps_db.execute(
        `INSERT INTO camp_quiz_audit_smes (sme_name, sme_title, quiz_id, quiz_topic)
         VALUES ($1, $2, $3, $4)`,
        [sme.name, sme.title, sme.quizId, sme.topic],
        { label: `Seed SME: ${sme.name} → ${sme.topic}` }
      );
    }

    return {
      success: true,
      quizzesSeeded: QUIZZES.filter((q) => !q.isPlaceholder).length,
      questionsSeeded,
      smesSeeded: SME_ROSTER.length,
    };
  },
});
