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
  const { run: addSme, loading: addingSme } = useApi("AuditAddSme");
  const { run: updateSme } = useApi("AuditUpdateSme");
  const { run: removeSme } = useApi("AuditRemoveSme");
  const [smeEditMode, setSmeEditMode] = useState(false);
  const [editedSmes, setEditedSmes] = useState<Array<{ name: string; title: string; original: string }>>([]);
  const [newSmeName, setNewSmeName] = useState("");
  const [newSmeTitle, setNewSmeTitle] = useState("");
  const [saving, setSaving] = useState(false);

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
          <p className="text-sm text-gray-500 mb-3">
            {data.questions.length > 0 && (() => {
              const types: Record<string, number> = {};
              data.questions.forEach((q) => {
                const label = q.question_type === "mc" ? "MC" : q.question_type === "tf" ? "TF" : q.question_type === "fill" ? "Fill" : q.question_type === "match" ? "Matching" : q.question_type;
                types[label] = (types[label] ?? 0) + 1;
              });
              const breakdown = Object.entries(types).map(([t, c]) => `${c} ${t}`).join(", ");
              return `${data.questions.length} questions — ${breakdown}`;
            })()}
          </p>

          {/* SMEs — header row with action buttons */}
          <div className="text-sm text-gray-600">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Subject Matter Experts:</span>
              <div className="flex items-center gap-2">
                {smeEditMode ? (
                  <>
                    <button onClick={() => { setSmeEditMode(false); setEditedSmes([]); setNewSmeName(""); setNewSmeTitle(""); }} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                    <button
                      disabled={saving}
                      onClick={async () => {
                        setSaving(true);
                        try {
                          // Process edits
                          for (const es of editedSmes) {
                            if (es.name !== es.original) {
                              const orig = data.smes.find(s => s.sme_name === es.original);
                              if (orig) await updateSme({ quizId, oldSmeName: es.original, newSmeName: es.name.trim(), newSmeTitle: es.title.trim() });
                            } else {
                              const orig = data.smes.find(s => s.sme_name === es.original);
                              if (orig && es.title !== orig.sme_title) {
                                await updateSme({ quizId, oldSmeName: es.original, newSmeName: es.name.trim(), newSmeTitle: es.title.trim() });
                              }
                            }
                          }
                          // Add new SME if filled
                          if (newSmeName.trim() && newSmeTitle.trim()) {
                            await addSme({ quizId, quizTopic, smeName: newSmeName.trim(), smeTitle: newSmeTitle.trim() });
                          }
                          toast.success("SMEs updated");
                          setSmeEditMode(false); setEditedSmes([]); setNewSmeName(""); setNewSmeTitle("");
                          refetch();
                        } catch (err) { toast.error("Failed to save"); }
                        setSaving(false);
                      }}
                      className="text-xs px-3 py-1 bg-green-700 text-white rounded hover:bg-green-800 disabled:opacity-50 font-medium"
                    >💾 Save</button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setSmeEditMode(true);
                        setEditedSmes(data.smes.map(s => ({ name: s.sme_name, title: s.sme_title, original: s.sme_name })));
                      }}
                      className="text-xs px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 font-medium text-gray-600"
                    >✏️ Edit</button>
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/audit`;
                        navigator.clipboard.writeText(url);
                        toast.success("Audit registration link copied! Share it with the SME via Slack.");
                      }}
                      className="text-xs px-3 py-1 border border-indigo-200 rounded hover:bg-indigo-50 font-medium text-indigo-600"
                    >📋 Invite an SME</button>
                  </>
                )}
              </div>
            </div>

            {smeEditMode ? (
              /* Edit mode — input rows with x to remove */
              <div className="space-y-2">
                {editedSmes.map((es, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input value={es.name} onChange={(e) => { const copy = [...editedSmes]; copy[i] = { ...copy[i], name: e.target.value }; setEditedSmes(copy); }} className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm outline-none focus:ring-1 focus:ring-amber-500" />
                    <input value={es.title} onChange={(e) => { const copy = [...editedSmes]; copy[i] = { ...copy[i], title: e.target.value }; setEditedSmes(copy); }} className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm outline-none focus:ring-1 focus:ring-amber-500" />
                    <button
                      onClick={async () => {
                        try {
                          await removeSme({ quizId, smeName: es.original });
                          setEditedSmes(editedSmes.filter((_, j) => j !== i));
                          toast.success(`Removed ${es.name}`);
                          refetch();
                        } catch (err) { toast.error("Failed to remove"); }
                      }}
                      className="text-red-400 hover:text-red-600 text-lg leading-none px-1"
                    >×</button>
                  </div>
                ))}
                {/* Add new row */}
                <div className="flex items-center gap-2">
                  <input value={newSmeName} onChange={(e) => setNewSmeName(e.target.value)} placeholder="New SME name" className="flex-1 px-3 py-1.5 border border-dashed border-gray-300 rounded text-sm outline-none focus:ring-1 focus:ring-amber-500" />
                  <input value={newSmeTitle} onChange={(e) => setNewSmeTitle(e.target.value)} placeholder="Role / Title" className="flex-1 px-3 py-1.5 border border-dashed border-gray-300 rounded text-sm outline-none focus:ring-1 focus:ring-amber-500" />
                  <span className="text-lg px-1 text-transparent">×</span>
                </div>
                <button
                  onClick={() => {
                    if (!newSmeName.trim() || !newSmeTitle.trim()) return;
                    setEditedSmes([...editedSmes, { name: newSmeName.trim(), title: newSmeTitle.trim(), original: "" }]);
                    setNewSmeName(""); setNewSmeTitle("");
                  }}
                  className="text-xs text-amber-700 hover:text-amber-800 font-medium"
                >+ Add SME</button>
              </div>
            ) : (
              /* Read-only mode — clean list */
              <div className="space-y-1">
                {data.smes.map((sme, i) => (
                  <div key={i} className="ml-4">
                    <span className="font-medium">{sme.sme_name}</span>
                    <span className="text-gray-400"> · {sme.sme_title}</span>
                    {sme.is_registered && <span className="ml-2 text-xs text-green-600">✓ Registered</span>}
                  </div>
                ))}
              </div>
            )}
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
              approvedCount={approvedSet.size}
              questionCount={data.questions.length}
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
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {data.edits.map((edit) => {
                const fieldLabel = edit.field_changed === "question_text" ? "Question Text"
                  : edit.field_changed === "options" ? "Answer Options"
                  : edit.field_changed === "correct_answer" ? "Correct Answer"
                  : edit.field_changed === "explanation" ? "Explanation"
                  : edit.field_changed;
                return (
                  <div key={edit.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-amber-800">👤 {edit.sme_name}</span>
                      <span className="text-gray-400 text-xs">
                        {new Date(edit.created_at).toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" })}
                      </span>
                      <span className="text-xs text-gray-500">· Q{edit.question_id} · {fieldLabel}</span>
                    </div>
                    {edit.old_value && (
                      <div className="mb-1">
                        <span className="text-xs font-medium text-red-500">Before:</span>
                        <p className="text-xs text-gray-600 line-clamp-2 pl-2 border-l-2 border-red-200">{edit.old_value}</p>
                      </div>
                    )}
                    {edit.new_value && (
                      <div>
                        <span className="text-xs font-medium text-green-600">After:</span>
                        <p className="text-xs text-gray-700 line-clamp-2 pl-2 border-l-2 border-green-300">{edit.new_value}</p>
                      </div>
                    )}
                  </div>
                );
              })}
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
          questions={data.questions}
          approvedSet={approvedSet}
          onRefresh={refetch}
        />
      </div>
    </div>
  );
}
