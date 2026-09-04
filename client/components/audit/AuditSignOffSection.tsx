import { useState, useCallback } from "react";
import { useApi } from "@/hooks/useApi.js";
import { toast } from "sonner";

interface Signoff {
  sme_name: string;
  notes: string | null;
  signed_at: string;
}

interface QuestionInfo {
  question_index: number;
  question_type: string;
}

interface Props {
  quizId: string;
  quizTopic: string;
  smeName: string;
  smeEmail: string;
  allQuestionsApproved: boolean;
  existingSignoffs: Signoff[];
  questionCount: number;
  approvedCount: number;
  questions: QuestionInfo[];
  approvedSet: Set<number>;
  onRefresh: () => void;
}

export default function AuditSignOffSection({
  quizId,
  quizTopic,
  smeName,
  smeEmail,
  allQuestionsApproved,
  existingSignoffs,
  questionCount,
  approvedCount,
  questions,
  approvedSet,
  onRefresh,
}: Props) {
  const [notes, setNotes] = useState("");
  const { run: signOff, loading } = useApi("AuditSignOff");
  const alreadySigned = existingSignoffs.some((s) => s.sme_name.toLowerCase() === smeName.toLowerCase());
  const canSignOff = allQuestionsApproved && !alreadySigned;

  const typeLabel = (t: string) =>
    t === "mc" ? "Multiple Choice" : t === "tf" ? "True or False" : t === "fill" ? "Fill in the Blank" : t === "match" ? "Matching" : t;

  const unapprovedQuestions = questions.filter((q) => !approvedSet.has(q.question_index));

  const handleSignOff = useCallback(async () => {
    try {
      await signOff({ quizId, smeName, smeEmail, notes: notes.trim() || null });
      toast.success("Audit signed off!");
      onRefresh();
    } catch (err) {
      const message = err && typeof err === "object" && "message" in err ? String((err as { message: unknown }).message) : String(err);
      toast.error("Sign-off failed: " + message);
    }
  }, [quizId, smeName, smeEmail, notes, signOff, onRefresh]);

  return (
    <div className="bg-green-50 border-2 border-green-200 border-dashed rounded-xl p-6 mb-6">
      <h2 className="text-lg font-bold text-gray-900 mb-2">✍️ Sign & Complete Audit</h2>
      <p className="text-sm text-gray-600 mb-4">
        By signing off, you confirm that you have reviewed all content for <strong>{quizTopic}</strong> and
        it is accurate as of today. Any notes you leave will be visible to the program administrator.
      </p>

      {/* Sections still needing approval */}
      {unapprovedQuestions.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <div className="text-sm font-medium text-red-700 mb-1">
            📋 {unapprovedQuestions.length} of {questionCount} questions still need approval:
          </div>
          <ul className="list-disc ml-5 text-sm text-red-600 space-y-0.5">
            {unapprovedQuestions.map((q) => (
              <li key={q.question_index}>
                <span className="font-medium">Question {q.question_index}</span>
                <span className="text-red-400"> ({typeLabel(q.question_type)})</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Existing sign-offs */}
      {existingSignoffs.length > 0 && (
        <div className="mb-4">
          <div className="text-sm font-medium text-green-700 mb-2">Previous sign-offs:</div>
          {existingSignoffs.map((s, i) => (
            <div key={i} className="text-sm text-green-800 mb-1">
              ✅ <strong>{s.sme_name}</strong> —{" "}
              {new Date(s.signed_at).toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" })}
              {s.notes && <span className="text-gray-500 ml-2">"{s.notes}"</span>}
            </div>
          ))}
        </div>
      )}

      {alreadySigned ? (
        <div className="text-green-700 font-semibold text-sm">
          ✅ You've already signed off on this quiz.
        </div>
      ) : (
        <>
          {/* Notes */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any observations, corrections needed, or general notes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            />
          </div>

          {/* Spekit reminder */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4 text-sm text-purple-800">
            <strong>🐙 Before you sign off</strong> — ask yourself: should any updates made today also be updated
            in <strong>Spekit</strong>? Changes to content, new resources, updated processes — if it lives in Spekit
            too, make sure both sources stay in sync.
          </div>

          {/* Sign off button */}
          <button
            onClick={handleSignOff}
            disabled={!canSignOff || loading}
            className={`w-full py-3 rounded-lg font-semibold text-sm transition-colors ${
              canSignOff
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
          >
            {loading
              ? "Signing off..."
              : canSignOff
              ? "🔒 Sign Off & Complete Audit"
              : "🔒 Approve all sections first"}
          </button>
        </>
      )}
    </div>
  );
}
