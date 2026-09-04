import { useState, useCallback } from "react";
import { useSuperblocksUser } from "@superblocksteam/library";
import { useApiData } from "@/hooks/useApiData.js";
import { toast } from "sonner";
import AuditRegisterGate from "@/components/audit/AuditRegisterGate.js";
import AuditTileGrid from "@/components/audit/AuditTileGrid.js";
import AuditQuizDetail from "@/components/audit/AuditQuizDetail.js";

const ADMIN_EMAILS = ["jt.bohland@amplitude.com"];

export default function AuditHomePage() {
  const user = useSuperblocksUser();
  const isAdmin = ADMIN_EMAILS.includes(user?.email?.toLowerCase() ?? "");

  // Admin auto-bypasses registration — use their Superblocks name directly
  const [smeName, setSmeName] = useState<string | null>(isAdmin ? (user?.name ?? "Admin") : null);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);

  const { data, loading, fetching, isError, error, refetch } = useApiData(
    "AuditGetDashboard",
    {},
    { enabled: smeName !== null }
  );

  const handleRegistered = useCallback((name: string) => {
    setSmeName(name);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedQuizId(null);
    refetch();
  }, [refetch]);

  // Gate: must register first
  if (!smeName) {
    return <AuditRegisterGate onComplete={handleRegistered} />;
  }

  // Detail view
  if (selectedQuizId) {
    const topic = data?.topics.find((t) => t.quiz_id === selectedQuizId);
    return (
      <AuditQuizDetail
        quizId={selectedQuizId}
        quizTopic={topic?.quiz_topic ?? selectedQuizId}
        smeName={smeName}
        smeEmail={user?.email ?? ""}
        isAdmin={isAdmin}
        onBack={handleBack}
      />
    );
  }

  // Home: tile grid
  return (
    <div className="min-h-screen bg-orange-50">
      {/* Header — compact, mirrors Ascent */}
      <header className="bg-amber-700 border-b border-amber-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🍁</span>
            <div>
              <h1 className="text-lg font-bold text-white">cAMP Quiz Audit</h1>
              <p className="text-xs text-amber-200">SME Quiz Review</p>
            </div>
          </div>
          <div className="text-right flex items-center gap-3">
            {isAdmin && (
              <button
                onClick={() => {
                  const url = `${window.location.origin}/audit`;
                  navigator.clipboard.writeText(url);
                  toast.success("Audit link copied! Share it with SMEs via Slack.");
                }}
                className="text-xs px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium transition-colors"
              >
                📋 Share the Audit
              </button>
            )}
            <div>
              <div className="text-xs text-amber-200">Signed in as</div>
              <div className="text-white font-semibold text-sm">{smeName}</div>
              {isAdmin && (
                <span className="inline-block mt-0.5 text-[10px] px-2 py-0.5 bg-amber-500 text-white rounded-full">
                  Admin
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Admin-only nav links */}
      {isAdmin && (
        <div className="max-w-6xl mx-auto px-6 pt-3 flex items-center gap-4 text-sm">
          <a href="/analytics" className="text-amber-700 hover:text-amber-900 font-medium">
            ← Back to Analytics
          </a>
          <span className="text-gray-300">|</span>
          <a href="/analytics" className="text-amber-700 hover:text-amber-900 font-medium">
            📊 Audit Progress Dashboard
          </a>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome box — mirrors Ascent layout */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <div className="flex items-start gap-4 mb-4">
            <span className="text-3xl mt-0.5">🍁</span>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Welcome to the cAMP Quiz Audit</h2>
              <p className="text-sm text-gray-600">
                As a Subject Matter Expert, you play a critical role in keeping our quiz content accurate and current.
                Review each quiz assigned to you — verify questions, options, and correct answers.
                When you're satisfied, sign off at the bottom of each quiz.
              </p>
            </div>
          </div>

          <details className="mt-3">
            <summary className="text-sm font-medium text-amber-700 cursor-pointer hover:text-amber-800">
              🏕️ What is cAMP Ascent?
            </summary>
            <p className="text-sm text-gray-600 mt-2">
              cAMP Ascent is Amplitude's interactive onboarding program for new GTM hires and internal promotions.
              It's organized into <strong>3 role-based learning paths</strong> (AE/PSM/Renewals, SDR, and Promotions),
              each with quiz-based knowledge checks. Every new rep goes through Ascent in their first 4 weeks.
              Your job is to verify that quiz content is accurate. Changes you make go <strong>live immediately</strong> for learners.
            </p>
          </details>
        </div>

        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
            Failed to load audit data: {(error as { message?: string })?.message ?? "Unknown error"}
          </div>
        )}

        {data && (
          <div className={fetching && !loading ? "opacity-70" : ""}>
            {fetching && !loading && (
              <div className="text-xs text-gray-500 mb-2">Updating...</div>
            )}
            <AuditTileGrid
              topics={data.topics}
              currentSmeName={smeName}
              isAdmin={isAdmin}
              onSelectTopic={setSelectedQuizId}
            />
          </div>
        )}
      </main>
    </div>
  );
}
