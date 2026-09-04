import { useState, useCallback } from "react";
import { useSuperblocksUser } from "@superblocksteam/library";
import { useApi } from "@/hooks/useApi.js";

const ADMIN_EMAILS = ["jt.bohland@amplitude.com"];

export default function AuditRegisterPage({ onComplete }: { onComplete: (smeName: string) => void }) {
  const user = useSuperblocksUser();
  const { run: registerSme, loading } = useApi("AuditRegisterSme");
  const { run: lookupSme } = useApi("AuditLookupSme");

  const [fullName, setFullName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [error, setError] = useState("");
  const [step, setStep] = useState<"form" | "not_found">("form");

  const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());

  const handleSubmit = useCallback(async () => {
    setError("");
    if (!fullName.trim() || !email.trim()) {
      setError("Please enter your full name and email.");
      return;
    }

    try {
      // Admin bypass
      if (isAdmin) {
        onComplete(fullName.trim());
        return;
      }

      // Check if SME is in the roster
      const lookup = await lookupSme({ smeEmail: email.trim().toLowerCase(), smeName: fullName.trim() });

      if (!lookup || !lookup.found) {
        setStep("not_found");
        return;
      }

      // Register
      await registerSme({ smeEmail: email.trim().toLowerCase(), smeName: fullName.trim() });
      onComplete(fullName.trim());
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : String(err);
      setError("Registration failed: " + message);
    }
  }, [fullName, email, isAdmin, registerSme, lookupSme, onComplete]);

  if (step === "not_found") {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600 mb-4">
            Your name wasn't found in the SME roster for the cAMP Quiz Audit. Only assigned Subject Matter Experts can access this tool.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            If you believe this is an error, please contact <strong>JT Bohland</strong>.
          </p>
          <button
            onClick={() => setStep("form")}
            className="text-amber-700 hover:text-amber-800 text-sm font-medium"
          >
            ← Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="bg-amber-700 rounded-t-xl p-6 text-center">
          <div className="text-4xl mb-2">🦉</div>
          <h1 className="text-2xl font-bold text-white">cAMP Quiz Audit</h1>
          <p className="text-amber-100 text-sm mt-1">SME Content Review Portal</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-b-xl shadow-lg p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Enter your name and email to access your assigned quiz reviews. Only pre-approved SMEs can register.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              placeholder="Your full name (must match the SME roster)"
            />
          </div>

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

          {error && (
            <p className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-amber-700 hover:bg-amber-800 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Verifying..." : "🔑 Access My Audits"}
          </button>
        </div>
      </div>
    </div>
  );
}
