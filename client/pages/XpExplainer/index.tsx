import { useNavigate } from "react-router";
import { useSuperblocksUser } from "@superblocksteam/library";
import { useApiData } from "@/hooks/useApiData.js";

// Tier definitions
const TIERS = [
  { emoji: "🏕️", name: "Base Camper", range: "0 – 75 XP", description: "Just getting started on the trail" },
  { emoji: "🥾", name: "Trailblazer", range: "76 – 150 XP", description: "Building momentum and confidence" },
  { emoji: "🧗🏼", name: "Summit Seeker", range: "151 – 234 XP", description: "Pushing toward mastery" },
  { emoji: "🏔️✨", name: "Pinnacle Achiever", range: "235+ XP", description: "The peak. You've conquered the Ascent." },
];

// Base XP actions
const BASE_ACTIONS = [
  { action: "Start a quiz", xp: "+1", note: "First attempt on any quiz" },
  { action: "Pass on Attempt 1", xp: "+5", note: "Nail it on the first try" },
  { action: "Pass on Attempt 2", xp: "+3", note: "Redemption on the second go" },
  { action: "Review a quiz", xp: "+2", note: "Come back and study your answers" },
  { action: "Retake attempt (3rd or 4th)", xp: "+1", note: "Persistence pays off" },
];

// Performance bonuses
const BONUSES = [
  { id: "ace", emoji: "💯", name: "Ace", xp: "+15", condition: "10/10 on Attempt 1 in under 10 min" },
  { id: "speed", emoji: "⚡", name: "Speed Bonus", xp: "+7", condition: "Pass Attempt 1 in under 10 min" },
  { id: "hotstreak", emoji: "🔥", name: "Hot Streak", xp: "+12", condition: "3 consecutive first-attempt passes" },
  { id: "cleansweep", emoji: "🧹", name: "Clean Sweep", xp: "+10", condition: "All 5 quizzes in a week passed on Attempt 1" },
  { id: "comeback", emoji: "💪", name: "The Comeback", xp: "+10", condition: "Fail Attempt 1, then score 10/10 on Attempt 2" },
  { id: "sameday", emoji: "📅", name: "Same-Day Double", xp: "+5", condition: "Complete 2 quizzes in one day" },
];

// Milestones
const MILESTONES = [
  { id: "m5", emoji: "⭐", name: "5 First-Attempt Passes", xp: "+10" },
  { id: "m10", emoji: "⭐⭐", name: "10 First-Attempt Passes", xp: "+15" },
  { id: "m15", emoji: "⭐⭐⭐", name: "15 First-Attempt Passes", xp: "+20" },
  { id: "surprise", emoji: "🎉", name: "???", xp: "????" },
];

export default function XpExplainerPage() {
  const navigate = useNavigate();
  const user = useSuperblocksUser();
  const userEmail = user?.email ?? "";

  const { data: xpData } = useApiData(
    "CampGetUserXP",
    { userEmail },
    { enabled: !!userEmail }
  );

  // Determine which bonuses/milestones the user has earned
  const earnedBonusIds = new Set(xpData?.earnedBonuses?.map((b) => b.id) ?? []);
  const earnedMilestoneIds = new Set(
    xpData?.milestones?.filter((m) => m.earned).map((m) => m.id) ?? []
  );

  // Check if redemption arc was earned (maps to "surprise" milestone)
  const redemptionEarned = xpData?.redemptionArcEarned ?? false;

  return (
    <div className="min-h-screen bg-orange-50">
      {/* Header */}
      <header className="bg-amber-700 border-b border-amber-800">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">🔭 XP-lanation</h1>
              <p className="text-sm text-amber-100 mt-1">How the Ascent scoring works</p>
            </div>
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 text-sm font-medium text-amber-100 border border-amber-500 rounded-lg hover:bg-amber-600 transition-colors"
            >
              🧠 Back to cAMP Quizzes
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-10">
        {/* Section 1: Intro */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">🏔️ Your Ascent Journey</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Every quiz you complete earns XP. How well you perform, how fast you move, and how you recover from misses all shape your score. Climb the tiers and reach the Pinnacle.
          </p>
        </section>

        {/* Section 2: Tiers */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-3">🪜 Tiers</h2>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-700">Tier</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-700">XP Range</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-700 hidden sm:table-cell">Description</th>
                </tr>
              </thead>
              <tbody>
                {TIERS.map((tier, i) => {
                  const isCurrentTier = xpData?.tier?.name === tier.name;
                  return (
                    <tr
                      key={tier.name}
                      className={`border-b border-slate-100 last:border-0 ${isCurrentTier ? "bg-indigo-50" : ""}`}
                    >
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <span className="mr-1.5">{tier.emoji}</span>
                        {tier.name}
                        {isCurrentTier && (
                          <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium">You</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{tier.range}</td>
                      <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">{tier.description}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 3: How You Earn XP */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-3">📝 How You Earn XP</h2>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-700">Action</th>
                  <th className="text-center px-4 py-2.5 font-semibold text-slate-700 w-16">XP</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-700 hidden sm:table-cell">Note</th>
                </tr>
              </thead>
              <tbody>
                {BASE_ACTIONS.map((row) => (
                  <tr key={row.action} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 text-slate-900">{row.action}</td>
                    <td className="px-4 py-3 text-center font-semibold text-indigo-600">{row.xp}</td>
                    <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 4: Performance Bonuses */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">⚡ Performance Bonuses</h2>
          <p className="text-xs text-slate-500 mb-3">
            Bonuses stack! ⚡ + 💯 = <span className="font-semibold">+22 on a single quiz</span> — the highest single-quiz score possible.
          </p>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-700">Bonus</th>
                  <th className="text-center px-4 py-2.5 font-semibold text-slate-700 w-16">XP</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-700 hidden sm:table-cell">How to Earn</th>
                </tr>
              </thead>
              <tbody>
                {BONUSES.map((bonus) => {
                  const earned = earnedBonusIds.has(bonus.id);
                  return (
                    <tr
                      key={bonus.id}
                      className={`border-b border-slate-100 last:border-0 transition-colors ${
                        earned ? "bg-amber-50" : ""
                      }`}
                    >
                      <td className={`px-4 py-3 font-medium ${earned ? "text-slate-900" : "text-slate-400"}`}>
                        <span className={`mr-1.5 ${earned ? "" : "grayscale opacity-50"}`}>{bonus.emoji}</span>
                        {bonus.name}
                        {earned && (
                          <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">Earned</span>
                        )}
                      </td>
                      <td className={`px-4 py-3 text-center font-semibold ${earned ? "text-indigo-600" : "text-slate-300"}`}>
                        {bonus.xp}
                      </td>
                      <td className={`px-4 py-3 hidden sm:table-cell ${earned ? "text-slate-600" : "text-slate-300"}`}>
                        {bonus.condition}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 5: Milestone Bonuses */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-2">🏆 Milestone Bonuses</h2>
          <p className="text-xs text-slate-500 mb-3">
            One surprise bonus is waiting. You'll know it when you find it. 🏔️
          </p>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-700">Milestone</th>
                  <th className="text-center px-4 py-2.5 font-semibold text-slate-700 w-16">XP</th>
                </tr>
              </thead>
              <tbody>
                {MILESTONES.map((milestone) => {
                  const isSurprise = milestone.id === "surprise";
                  // Never reveal the surprise — even if earned
                  const earned = isSurprise ? false : earnedMilestoneIds.has(milestone.id) || (milestone.id === "redemption" && redemptionEarned);
                  return (
                    <tr
                      key={milestone.id}
                      className={`border-b border-slate-100 last:border-0 transition-colors ${
                        earned ? "bg-amber-50" : ""
                      }`}
                    >
                      <td className={`px-4 py-3 font-medium ${earned ? "text-slate-900" : isSurprise ? "text-slate-400 italic" : "text-slate-400"}`}>
                        <span className={`mr-1.5 ${earned ? "" : "grayscale opacity-50"}`}>{milestone.emoji}</span>
                        {milestone.name}
                        {earned && (
                          <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">Earned</span>
                        )}
                      </td>
                      <td className={`px-4 py-3 text-center font-semibold ${earned ? "text-indigo-600" : isSurprise ? "text-slate-300 italic" : "text-slate-300"}`}>
                        {milestone.xp}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Footer nudge */}
        <div className="text-center py-4">
          <p className="text-xs text-slate-400">
            Keep climbing. The Pinnacle awaits. 🏔️✨
          </p>
        </div>
      </main>
    </div>
  );
}
