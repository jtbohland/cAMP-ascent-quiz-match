import { useState, useCallback } from "react";
import { useApiData } from "@/hooks/useApiData.js";
import { useApi } from "@/hooks/useApi.js";
import { toast } from "sonner";
import AuditQuestionCard from "./AuditQuestionCard.js";
import AuditNotesThread from "./AuditNotesThread.js";
import AuditSignOffSection from "./AuditSignOffSection.js";

interface Props {
  quizId: string;
  quizTopic: string;
  smeName: string;
  smeEmail: string;
  isAdmin: boolean;
  onBack: () => void;
}

export default function AuditQuizDetail({ quizId, quizTopic, smeName, smeEmail, isAdmin, onBack }: Props) {
  const { data, loading, fetching, isError, error, refetch } = useApiData("AuditGetQuizDetail", { quizId });

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50 p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-orange-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
            Failed to load quiz: {(error as { message?: string })?.message ?? "Unknown error"}
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const approvedSet = new Set(data.approvals.map((a) => a.question_id));
  const allQuestionsApproved = data.questions.length > 0 && data.questions.every((q) => approvedSet.has(q.question_index));

  return (
    <div className="min-h-screen bg-orange-50">
      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* Back link */}
        <button onClick={onBack} className="text-sm text-amber-700 hover:text-amber-800 font-medium mb-4 inline-flex items-center gap-1">
          ← Back to all topics
        </button>

        {/* Warning banner */}
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 mb-6 flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="font-bold text-amber-800">Changes go live immediately</h3>
            <p className="text-sm text-amber-700">
              Any edits you make here will be pushed directly into the production quiz experience.
              If a mistake is made, your admin can revert individual changes.
            </p>
          </div>
        </div>

        {/* Quiz header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h1 className="text-xl font-bold text-gray-900 mb-1">{quizTopic}</h1>
          <p className="text-sm text-gray-500 mb-3">Quiz ID: {quizId} · {data.questions.length} questions</p>

          {/* SMEs */}
          <div className="text-sm text-gray-600">
            <span className="font-medium">Subject Matter Experts:</span>
            {data.smes.map((sme, i) => (
              <div key={i} className="ml-4 mt-1">
                <span className="font-medium">{sme.sme_name}</span>
                <span className="text-gray-400"> · {sme.sme_title}</span>
                {sme.is_registered && <span className="ml-2 text-xs text-green-600">✓ Registered</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Questions */}
        <div className={`space-y-4 mb-8 ${fetching && !loading ? "opacity-70" : ""}`}>
          <h2 className="text-lg font-semibold text-gray-800">
            🦉 Quiz Questions ({data.questions.length})
          </h2>
          {data.questions.map((q) => (
            <AuditQuestionCard
              key={q.id}
              question={q}
              quizId={quizId}
              smeName={smeName}
              smeEmail={smeEmail}
              isApproved={approvedSet.has(q.question_index)}
              edits={data.edits.filter((e) => e.question_id === q.question_index)}
              onRefresh={refetch}
            />
          ))}
        </div>

        {/* Notes thread */}
        <AuditNotesThread
          quizId={quizId}
          notes={data.notes}
          smeName={smeName}
          smeEmail={smeEmail}
          onRefresh={refetch}
        />

        {/* Edit history (admin) */}
        {data.edits.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">📋 Change History</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.edits.map((edit) => (
                <div key={edit.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-amber-800">👤 {edit.sme_name}</span>
                    <span className="text-gray-400 text-xs">
                      {new Date(edit.created_at).toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                  <div className="text-gray-700">
                    Changed <strong>{edit.field_changed}</strong> on Q{edit.question_id}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sign-off */}
        <AuditSignOffSection
          quizId={quizId}
          quizTopic={quizTopic}
          smeName={smeName}
          smeEmail={smeEmail}
          allQuestionsApproved={allQuestionsApproved}
          existingSignoffs={data.signoffs}
          questionCount={data.questions.length}
          approvedCount={approvedSet.size}
          onRefresh={refetch}
        />
      </div>
    </div>
  );
}
