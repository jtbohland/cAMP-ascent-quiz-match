import { useState, useCallback } from "react";
import { useApi } from "@/hooks/useApi.js";
import { toast } from "sonner";

interface Note {
  id: number;
  author_name: string;
  author_email: string;
  note_text: string;
  created_at: string;
}

interface Props {
  quizId: string;
  notes: Note[];
  smeName: string;
  smeEmail: string;
  onRefresh: () => void;
}

export default function AuditNotesThread({ quizId, notes, smeName, smeEmail, onRefresh }: Props) {
  const [newNote, setNewNote] = useState("");
  const { run: addNote, loading } = useApi("AuditAddNote");

  const handleSubmit = useCallback(async () => {
    if (!newNote.trim()) return;
    try {
      await addNote({ quizId, authorName: smeName, authorEmail: smeEmail, noteText: newNote.trim() });
      setNewNote("");
      toast.success("Note added");
      onRefresh();
    } catch (err) {
      const message = err && typeof err === "object" && "message" in err ? String((err as { message: unknown }).message) : String(err);
      toast.error("Failed to add note: " + message);
    }
  }, [newNote, quizId, smeName, smeEmail, addNote, onRefresh]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">📝 Notes on this quiz</h2>

      {/* Existing notes */}
      {notes.length > 0 ? (
        <div className="space-y-3 mb-4">
          {notes.map((note) => (
            <div key={note.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-amber-800">👤 {note.author_name}</span>
                <span className="text-xs text-gray-400">
                  {new Date(note.created_at).toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" })}
                </span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.note_text}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 mb-4">No notes yet</p>
      )}

      {/* Add note */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Add notes..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
        />
        <button
          onClick={handleSubmit}
          disabled={loading || !newNote.trim()}
          className="px-4 py-2 bg-amber-700 text-white text-sm rounded-lg hover:bg-amber-800 disabled:opacity-50"
        >
          {loading ? "..." : "Add"}
        </button>
      </div>
    </div>
  );
}
