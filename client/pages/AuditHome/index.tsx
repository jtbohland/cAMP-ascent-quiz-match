import { useState, useCallback } from "react";
import { useSuperblocksUser } from "@superblocksteam/library";
import { useApiData } from "@/hooks/useApiData.js";
import AuditRegisterGate from "@/components/audit/AuditRegisterGate.js";
import AuditTileGrid from "@/components/audit/AuditTileGrid.js";
import AuditQuizDetail from "@/components/audit/AuditQuizDetail.js";

const ADMIN_EMAILS = ["jt.bohland@amplitude.com"];

export default function AuditHomePage() {
  const user = useSuperblocksUser();
  const [smeName, setSmeName] = useState<string | null>(null);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);

  const isAdmin = ADMIN_EMAILS.includes(user?.email?.toLowerCase() ?? "");

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
      {/* Header */}
      <header className="bg-amber-700 border-b border-amber-800">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-3xl">🍁</span>
                <div>
                  <h1 className="text-2xl font-bold text-white">Welcome to the cAMP Quiz Audit</h1>
                  <p className="text-sm text-amber-100 mt-1">
                    As a Subject Matter Expert, review quiz questions and resources assigned to you.
                    When you're satisfied, sign off at the bottom of each quiz.
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-amber-100">Signed in as</div>
              <div className="text-white font-semibold">{smeName}</div>
              {isAdmin && (
                <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-amber-500 text-white rounded-full">
                  Admin
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* What is cAMP Ascent info box */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-2">
            <span>🏕️</span> What is cAMP Ascent?
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            cAMP Ascent is Amplitude's interactive onboarding program for new GTM hires and internal promotions.
            It's organized into <strong>3 role-based learning paths</strong> (AE/PSM/Renewals, SDR, and Promotions),
            each with quiz-based knowledge checks. Every new rep goes through Ascent in their first 4 weeks.
          </p>
          <p className="text-sm text-gray-600">
            Your job as an SME is to verify the quiz questions, options, correct answers, and linked resources
            are accurate and current. Changes you make go <strong>live immediately</strong> for learners.
          </p>
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
