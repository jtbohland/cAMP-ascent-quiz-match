import { useState, useCallback } from "react";
import { useSuperblocksUser } from "@superblocksteam/library";
import { useApi } from "@/hooks/useApi.js";
import WelcomeModal from "@/components/camp/WelcomeModal.js";

const ROLES = [
  "SDR",
  "Velocity AE",
  "Emerging AE",
  "Majors AE",
  "Strat AE",
  "PSM",
  "Renewals",
  "Admin",
] as const;

const REGIONS = [
  { value: "NAMER", label: "🌎 NAMER — Americas" },
  { value: "EMEA", label: "🌍 EMEA — Europe, Middle East & Africa" },
  { value: "AAPJ", label: "🌏 AAPJ — Asia, Australia, Pacific & Japan" },
] as const;

const MANAGERS = [
  "Adam Yapkowitz",
  "Alice Steels",
  "Anush Arora",
  "Brian Wagner",
  "Gamon Yaklich",
  "Halle Morris",
  "Jeremy Grinbaum",
  "Jessica Arnold",
  "Joe Skupinsky",
  "Kazuki Hirose",
  "Kevin Shain",
  "Kier Johnson",
  "Lauren Hargarten",
  "Lee Edwards",
  "Madhuri Krishnan",
  "Maggie Peracchi",
  "Mathieu Di Franco",
  "Matt Bennett",
  "Nick Iyengar",
  "Nick Ryan",
  "Nicolette Conti",
  "Rhiannon Sheehan",
  "Rob Bow",
  "Shawn Hensley",
  "Tansu Yegen",
] as const;

export default function RegisterPage({ onComplete }: { onComplete: () => void }) {
  const user = useSuperblocksUser();
  const { run: register, loading } = useApi("CampRegisterViewer");

  const [fullName, setFullName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [role, setRole] = useState("");
  const [manager, setManager] = useState("");
  const [region, setRegion] = useState("");
  const [ascentDay1, setAscentDay1] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [error, setError] = useState("");
  const [showWelcome, setShowWelcome] = useState(false);

  const isPastDate = useCallback((dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(dateStr + "T00:00:00");
    return selected < today;
  }, []);

  const handleSubmit = useCallback(async () => {
    setError("");
    if (!fullName.trim() || !email.trim() || !role || !manager || !region || !ascentDay1) {
      setError("Please fill out all fields.");
      return;
    }

    try {
      const result = await register({
        userName: fullName.trim(),
        userEmail: email.trim().toLowerCase(),
        userRole: role,
        managerName: manager,
        managerEmail: null,
        region,
        ascentDay1,
      });

      if (result?.isNew) {
        setShowWelcome(true);
      } else {
        onComplete();
      }
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : String(err);
      setError("Registration failed: " + message);
    }
  }, [fullName, email, role, manager, region, ascentDay1, register, onComplete]);

  if (showWelcome) {
    return <WelcomeModal userName={fullName} onDismiss={onComplete} />;
  }

  return (
    <div className="min-h-screen bg-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="bg-amber-700 rounded-t-xl p-6 text-center">
          <div className="text-4xl mb-2">🏕️</div>
          <h1 className="text-2xl font-bold text-white">Welcome to cAMP Quizzes</h1>
          <p className="text-amber-100 text-sm mt-1">Let's get you set up for the trail</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-b-xl shadow-lg p-6 space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              placeholder="Your full name"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-gray-50"
              placeholder="you@amplitude.com"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white"
            >
              <option value="">Select your role</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Region */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white"
            >
              <option value="">Select your region</option>
              {REGIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Manager */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Manager</label>
            <select
              value={manager}
              onChange={(e) => setManager(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white"
            >
              <option value="">Select your manager</option>
              {MANAGERS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Ascent Day 1 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ascent Day 1</label>
            <input
              type="date"
              value={ascentDay1}
              onChange={(e) => setAscentDay1(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
            />
            {isPastDate(ascentDay1) && (
              <p className="text-amber-600 text-xs mt-1 flex items-center gap-1">
                <span>⚠️</span> This date is in the past — double check if that's right
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</p>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-amber-700 hover:bg-amber-800 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Registering..." : "⛰️ Start My Ascent"}
          </button>
        </div>
      </div>
    </div>
  );
}
