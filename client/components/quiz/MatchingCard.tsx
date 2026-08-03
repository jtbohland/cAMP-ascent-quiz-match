import { useState, useCallback, useMemo, useRef } from "react";

interface MatchPair {
  term: string;
  match: string;
}

interface MatchingCardProps {
  pairs: MatchPair[];
  questionId: number;
  onAnswer: (answer: string) => void;
  userAnswer: string | null;
  showFeedback: boolean;
}

/**
 * Drag-and-drop matching question.
 *
 * Supports duplicate match values (e.g. two pairs both mapping to "30%").
 * Internally tracks assignments by pair index so identical texts don't collide.
 *
 * Answer format (unchanged): JSON string of user matches,
 * e.g. {"term1":"matchA","term2":"matchB"}
 * Grading: all-or-nothing for score, but shows partial credit feedback.
 */
export default function MatchingCard({
  pairs,
  questionId,
  onAnswer,
  userAnswer,
  showFeedback,
}: MatchingCardProps) {
  // Build shuffled indices (not values) so duplicates stay distinct
  const shuffledIndices = useMemo(() => {
    const indices = pairs.map((_, i) => i);
    let seed = questionId * 2654435761;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) & 0xffffffff;
      return (seed >>> 0) / 0xffffffff;
    };
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
  }, [pairs, questionId]);

  // Parse user answer into a term→matchText mapping (external format, unchanged)
  const userMatches: Record<string, string> = useMemo(() => {
    if (!userAnswer) return {};
    try {
      return JSON.parse(userAnswer);
    } catch {
      return {};
    }
  }, [userAnswer]);

  // Internal: map term→pairIndex for tracking which *specific* tile is assigned
  // This lets two terms both hold "30%" without collision
  const termToIndex: Record<string, number> = useMemo(() => {
    const map: Record<string, number> = {};
    // For each term that has a matched value, find which pair index it used.
    // We greedily assign indices, marking used ones so duplicates don't collide.
    const usedIndices = new Set<number>();
    for (const pair of pairs) {
      const matchedValue = userMatches[pair.term];
      if (matchedValue == null) continue;
      // Find a pair index whose match text equals matchedValue and isn't already used
      for (let i = 0; i < pairs.length; i++) {
        if (!usedIndices.has(i) && pairs[i].match === matchedValue) {
          map[pair.term] = i;
          usedIndices.add(i);
          break;
        }
      }
    }
    return map;
  }, [pairs, userMatches]);

  // Track which tile index is being dragged (index, not text)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverTerm, setDragOverTerm] = useState<string | null>(null);
  // Track touch drag state
  const touchRef = useRef<{ index: number; startY: number } | null>(null);

  // Available tile indices = those not currently assigned to any term
  const assignedIndices = new Set(Object.values(termToIndex));
  const availableIndices = shuffledIndices.filter((i) => !assignedIndices.has(i));

  const updateMatches = useCallback(
    (newMatches: Record<string, string>) => {
      onAnswer(JSON.stringify(newMatches));
    },
    [onAnswer],
  );

  const handleDrop = useCallback(
    (term: string) => {
      if (showFeedback || draggedIndex == null) return;
      const draggedValue = pairs[draggedIndex].match;
      const newMatches = { ...userMatches };

      // Free any term that was assigned this specific index
      // (find by checking which term currently maps to draggedIndex)
      for (const [t, idx] of Object.entries(termToIndex)) {
        if (idx === draggedIndex) {
          delete newMatches[t];
          break;
        }
      }

      // If this term already has a match, free it
      // (the old index will be freed automatically via termToIndex recalc)
      newMatches[term] = draggedValue;
      updateMatches(newMatches);
      setDraggedIndex(null);
      setDragOverTerm(null);
    },
    [showFeedback, draggedIndex, pairs, userMatches, termToIndex, updateMatches],
  );

  const removeMatch = useCallback(
    (term: string) => {
      if (showFeedback) return;
      const newMatches = { ...userMatches };
      delete newMatches[term];
      updateMatches(newMatches);
    },
    [showFeedback, userMatches, updateMatches],
  );

  // Compute correctness for feedback
  const correctMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const pair of pairs) {
      map[pair.term] = userMatches[pair.term] === pair.match;
    }
    return map;
  }, [pairs, userMatches]);

  const correctCount = Object.values(correctMap).filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Feedback summary */}
      {showFeedback && (
        <div
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            correctCount === pairs.length
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-orange-50 text-orange-700 border border-orange-200"
          }`}
        >
          {correctCount === pairs.length
            ? `✅ All ${pairs.length} matches correct!`
            : `${correctCount} of ${pairs.length} matches correct`}
        </div>
      )}

      {/* Terms with drop zones */}
      <div className="space-y-2">
        {pairs.map((pair) => {
          const matched = userMatches[pair.term];
          const isOver = dragOverTerm === pair.term;
          const isCorrect = correctMap[pair.term];

          let borderClass = "border-slate-200";
          let bgClass = "bg-white";
          if (showFeedback && matched) {
            borderClass = isCorrect ? "border-green-300" : "border-red-300";
            bgClass = isCorrect ? "bg-green-50" : "bg-red-50";
          } else if (isOver) {
            borderClass = "border-blue-400";
            bgClass = "bg-blue-50/50";
          }

          return (
            <div
              key={pair.term}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${borderClass} ${bgClass}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverTerm(pair.term);
              }}
              onDragLeave={() => setDragOverTerm(null)}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop(pair.term);
              }}
            >
              {/* Term label */}
              <div className="flex-1 text-sm font-medium text-slate-700">
                {pair.term}
              </div>

              {/* Arrow */}
              <span className="text-slate-300 text-lg">→</span>

              {/* Drop zone / matched tile */}
              <div className="flex-1">
                {matched ? (
                  <div
                    className={`flex items-center justify-between px-3 py-2 rounded-md text-sm ${
                      showFeedback
                        ? isCorrect
                          ? "bg-green-100 text-green-800 border border-green-300"
                          : "bg-red-100 text-red-800 border border-red-300"
                        : "bg-blue-100 text-blue-800 border border-blue-300 cursor-pointer hover:bg-blue-200"
                    }`}
                    onClick={() => !showFeedback && removeMatch(pair.term)}
                  >
                    <span>{matched}</span>
                    {!showFeedback && (
                      <span className="ml-2 text-blue-400 hover:text-blue-600 text-xs">
                        ✕
                      </span>
                    )}
                    {showFeedback && !isCorrect && (
                      <span className="ml-2 text-xs text-red-500">
                        → {pair.match}
                      </span>
                    )}
                  </div>
                ) : (
                  <div
                    className={`px-3 py-2 rounded-md border-2 border-dashed text-sm text-center ${
                      isOver
                        ? "border-blue-400 bg-blue-50 text-blue-500"
                        : "border-slate-300 text-slate-400"
                    }`}
                  >
                    {isOver ? "Drop here" : "Drag match here"}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Available match tiles to drag — one per pair, keyed by index */}
      {!showFeedback && availableIndices.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wide">
            Available Matches
          </p>
          <div className="flex flex-wrap gap-2">
            {availableIndices.map((idx) => (
              <div
                key={idx}
                draggable
                onDragStart={() => setDraggedIndex(idx)}
                onDragEnd={() => {
                  setDraggedIndex(null);
                  setDragOverTerm(null);
                }}
                className={`px-3 py-2 rounded-md border text-sm cursor-grab active:cursor-grabbing transition-all ${
                  draggedIndex === idx
                    ? "border-blue-400 bg-blue-100 text-blue-800 opacity-50"
                    : "border-slate-300 bg-slate-50 text-slate-700 hover:border-blue-300 hover:bg-blue-50"
                }`}
              >
                {pairs[idx].match}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
