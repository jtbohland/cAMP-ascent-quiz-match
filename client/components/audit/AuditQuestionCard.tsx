import { useState, useCallback } from "react";
import { useApi } from "@/hooks/useApi.js";
import { toast } from "sonner";

interface Question {
  id: number;
  quiz_id: string;
  question_index: number;
  question_type: string;
  lo: string | null;
  question_text: string;
  options?: unknown;
  correct_answer?: unknown;
  explanation: string | null;
  placeholder: string | null;
  pairs?: unknown;
  resource?: unknown;
}

interface Edit {
  id: number;
  question_id: number;
  sme_name: string;
  field_changed: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

interface Props {
  question: Question;
  quizId: string;
  smeName: string;
  smeEmail: string;
  isApproved: boolean;
  approvedCount: number;
  questionCount: number;
  edits: Edit[];
  onRefresh: () => void;
}

export default function AuditQuestionCard({ question, quizId, smeName, smeEmail, isApproved, approvedCount, questionCount, edits, onRefresh }: Props) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(question.question_text);
  const [editOptions, setEditOptions] = useState<string[]>(
    Array.isArray(question.options) ? (question.options as string[]) : []
  );
  const [editCorrect, setEditCorrect] = useState<unknown>(question.correct_answer);
  const [editExplanation, setEditExplanation] = useState(question.explanation ?? "");

  const { run: saveEdit, loading: saving } = useApi("AuditSaveQuestionEdit");
  const { run: approveQuestion, loading: approving } = useApi("AuditApproveQuestion");

  const options = Array.isArray(question.options) ? (question.options as string[]) : [];
  const correctAnswer = question.correct_answer;

  const handleSave = useCallback(async () => {
    try {
      // Check what changed and save each diff
      if (editText !== question.question_text) {
        await saveEdit({
          questionDbId: question.id,
          quizId,
          questionIndex: question.question_index,
          field: "question_text",
          oldValue: question.question_text,
          newValue: editText,
          smeName,
          smeEmail,
        });
      }
      if (JSON.stringify(editOptions) !== JSON.stringify(question.options)) {
        await saveEdit({
          questionDbId: question.id,
          quizId,
          questionIndex: question.question_index,
          field: "options",
          oldValue: JSON.stringify(question.options),
          newValue: JSON.stringify(editOptions),
          smeName,
          smeEmail,
        });
      }
      if (JSON.stringify(editCorrect) !== JSON.stringify(question.correct_answer)) {
        await saveEdit({
          questionDbId: question.id,
          quizId,
          questionIndex: question.question_index,
          field: "correct_answer",
          oldValue: JSON.stringify(question.correct_answer),
          newValue: JSON.stringify(editCorrect),
          smeName,
          smeEmail,
        });
      }
      if (editExplanation !== (question.explanation ?? "")) {
        await saveEdit({
          questionDbId: question.id,
          quizId,
          questionIndex: question.question_index,
          field: "explanation",
          oldValue: question.explanation,
          newValue: editExplanation,
          smeName,
          smeEmail,
        });
      }
      toast.success(`Question ${question.question_index} saved`);
      setEditing(false);
      onRefresh();
    } catch (err) {
      const message = err && typeof err === "object" && "message" in err ? String((err as { message: unknown }).message) : String(err);
      toast.error("Save failed: " + message);
    }
  }, [editText, editOptions, editCorrect, editExplanation, question, quizId, smeName, smeEmail, saveEdit, onRefresh]);

  const handleApprove = useCallback(async () => {
    try {
      await approveQuestion({ quizId, questionIndex: question.question_index, approvedBy: smeName });
      toast.success(`Q${question.question_index} approved`);
      onRefresh();
    } catch (err) {
      const message = err && typeof err === "object" && "message" in err ? String((err as { message: unknown }).message) : String(err);
      toast.error("Approve failed: " + message);
    }
  }, [quizId, question.question_index, smeName, approveQuestion, onRefresh]);

  return (
    <div className={`bg-white rounded-xl border-2 p-5 ${isApproved ? "border-green-300 bg-green-50/30" : "border-gray-200"}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">
            Q{question.question_index}
          </span>
          <span className="text-xs text-gray-400">
            {question.question_type === "mc" ? "Multiple Choice"
              : question.question_type === "tf" ? "True or False"
              : question.question_type === "fill" ? "Fill in the Blank"
              : question.question_type === "match" ? "Matching"
              : question.question_type}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!editing && !isApproved && (
            <button
              onClick={() => setEditing(true)}
              className="text-xs px-3 py-1 text-amber-700 border border-amber-300 rounded-lg hover:bg-amber-50"
            >
              ✏️ Edit
            </button>
          )}
          {!isApproved && (
            <button
              onClick={handleApprove}
              disabled={approving}
              className="text-xs px-3 py-1 text-green-700 border border-green-300 rounded-lg hover:bg-green-50 disabled:opacity-50"
            >
              ✅ Approve
            </button>
          )}
          {isApproved && (
            <span className="text-xs text-green-600 font-medium">
              ✅ Approved · {approvedCount}/{questionCount}
            </span>
          )}
        </div>
      </div>

      {/* Question text */}
      {editing ? (
        <textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
        />
      ) : (
        <p className="text-sm text-gray-900 mb-3 leading-relaxed">{question.question_text}</p>
      )}

      {/* Options (for mc/tf) */}
      {options.length > 0 && (
        <div className="space-y-2 mb-3">
          {editing
            ? editOptions.map((opt, i) => (
                <div key={i} className="flex items-start gap-2">
                  <input
                    type="radio"
                    checked={editCorrect === i}
                    onChange={() => setEditCorrect(i)}
                    className="mt-1"
                  />
                  <textarea
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...editOptions];
                      newOpts[i] = e.target.value;
                      setEditOptions(newOpts);
                    }}
                    rows={2}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              ))
            : options.map((opt, i) => {
                const isCorrect = correctAnswer === i;
                return (
                  <div
                    key={i}
                    className={`text-xs p-2 rounded-lg border ${
                      isCorrect
                        ? "border-green-300 bg-green-50 text-green-800"
                        : "border-gray-200 bg-gray-50 text-gray-700"
                    }`}
                  >
                    <span className="font-mono text-gray-400 mr-2">{String.fromCharCode(65 + i)}.</span>
                    {opt}
                    {isCorrect && <span className="ml-2 text-green-600 font-semibold">✓ Correct</span>}
                  </div>
                );
              })}
        </div>
      )}

      {/* Explanation */}
      {editing ? (
        <div className="mb-3">
          <label className="text-xs font-medium text-gray-500 mb-1 block">Explanation</label>
          <textarea
            value={editExplanation}
            onChange={(e) => setEditExplanation(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 outline-none"
          />
        </div>
      ) : (
        question.explanation && (
          <details className="text-xs text-gray-600 mb-2">
            <summary className="cursor-pointer text-amber-700 font-medium">Show explanation</summary>
            <p className="mt-1 pl-2 border-l-2 border-amber-200">{question.explanation}</p>
          </details>
        )
      )}

      {/* Edit actions */}
      {editing && (
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-xs px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 disabled:opacity-50"
          >
            {saving ? "Saving..." : "💾 Save Changes"}
          </button>
          <button
            onClick={() => {
              setEditing(false);
              setEditText(question.question_text);
              setEditOptions(options);
              setEditCorrect(correctAnswer);
              setEditExplanation(question.explanation ?? "");
            }}
            className="text-xs px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Recent edits for this question */}
      {edits.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-400 mb-1">Recent changes:</div>
          {edits.slice(0, 3).map((edit) => (
            <div key={edit.id} className="text-xs text-gray-500">
              {edit.sme_name} changed <span className="font-medium">{edit.field_changed}</span>{" "}
              <span className="text-gray-400">
                {new Date(edit.created_at).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
