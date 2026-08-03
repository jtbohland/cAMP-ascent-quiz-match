import { useMemo, useState, useCallback } from "react";
import type { Question } from "@/data/quiz-types.js";
import MatchingCard from "./MatchingCard.js";

interface QuestionCardProps {
  question: Question;
  index: number;
  total: number;
  userAnswer: string | null;
  onAnswer: (answer: string) => void;
  showFeedback?: boolean;
  isCorrect?: boolean;
  showResource?: boolean;
}

/**
 * Creates a seeded shuffle permutation for MC answer options.
 * Returns the shuffled options, a mapping from shuffled→original indices,
 * and the new position of the correct answer in the shuffled order.
 */
function createOptionShuffle(
  options: string[],
  correctIndex: number,
  questionId: number,
  sessionSeed: number
) {
  const indices = options.map((_, i) => i);
  // Seeded Fisher-Yates using question ID + per-session random seed
  let seed = Math.floor((questionId + sessionSeed * 100000) * 2654435761) & 0xffffffff;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 0xffffffff;
  };
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return {
    shuffledOptions: indices.map((origIdx) => options[origIdx]),
    // originalIndices[shuffledPos] = originalPos
    originalIndices: indices,
    shuffledCorrectIndex: indices.indexOf(correctIndex),
  };
}

export default function QuestionCard({
  question,
  index,
  total,
  userAnswer,
  onAnswer,
  showFeedback = false,
  isCorrect,
  showResource = false,
}: QuestionCardProps) {
  // Per-session random seed — stable for this component instance
  const [sessionSeed] = useState(() => Math.random());

  // Shuffle MC options (not T/F or fill-in-the-blank)
  const optionShuffle = useMemo(() => {
    if (question.type !== "mc" || !question.options || question.options.length <= 1) return null;
    return createOptionShuffle(
      question.options,
      question.correct as number,
      question.id,
      sessionSeed
    );
  }, [question.id, question.type, question.options, question.correct, sessionSeed]);

  // Map userAnswer (original index) → shuffled position for display
  const mcSelected = useMemo(() => {
    if (!optionShuffle || userAnswer === null) return userAnswer;
    const origIdx = parseInt(userAnswer);
    const shuffledPos = optionShuffle.originalIndices.indexOf(origIdx);
    return shuffledPos >= 0 ? String(shuffledPos) : userAnswer;
  }, [optionShuffle, userAnswer]);

  // Map shuffled selection → original index for the parent
  const mcOnAnswer = useCallback(
    (shuffledIdx: string) => {
      if (!optionShuffle) {
        onAnswer(shuffledIdx);
        return;
      }
      const origIdx = optionShuffle.originalIndices[parseInt(shuffledIdx)];
      onAnswer(String(origIdx));
    },
    [optionShuffle, onAnswer]
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          Question {index + 1} of {total}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
          {question.type === "mc" ? "Multiple Choice" : question.type === "tf" ? "True / False" : question.type === "match" ? "Matching" : "Fill in the Blank"}
        </span>
      </div>

      <p className="text-base font-medium text-slate-900 mb-5 leading-relaxed">{question.text}</p>

      {question.type === "mc" && question.options && (
        <MultipleChoiceOptions
          options={optionShuffle ? optionShuffle.shuffledOptions : question.options}
          selected={mcSelected}
          onSelect={mcOnAnswer}
          showFeedback={showFeedback}
          correctIndex={optionShuffle ? optionShuffle.shuffledCorrectIndex : (question.correct as number)}
        />
      )}

      {question.type === "tf" && (
        <MultipleChoiceOptions
          options={["True", "False"]}
          selected={userAnswer}
          onSelect={onAnswer}
          showFeedback={showFeedback}
          correctIndex={question.correct as number}
        />
      )}

      {question.type === "fill" && (
        <FillInBlank
          value={userAnswer ?? ""}
          onChange={onAnswer}
          placeholder={question.placeholder ?? "Type your answer..."}
          showFeedback={showFeedback}
          isCorrect={isCorrect}
        />
      )}

      {question.type === "match" && question.pairs && (
        <MatchingCard
          pairs={question.pairs}
          questionId={question.id}
          onAnswer={onAnswer}
          userAnswer={userAnswer}
          showFeedback={showFeedback}
        />
      )}

      {showFeedback && (
        <div
          className={`mt-5 p-4 rounded-lg border ${
            isCorrect
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-start gap-2">
            <span className="text-lg">{isCorrect ? "✅" : "❌"}</span>
            <div>
              <p className="font-semibold text-sm mb-1">{isCorrect ? "Correct!" : "Incorrect"}</p>
              <p className="text-sm leading-relaxed">{question.explanation}</p>
              {showResource && question.resource && (
                <a
                  href={question.resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1 mt-2 text-xs font-medium underline ${
                    isCorrect ? "text-green-700 hover:text-green-900" : "text-red-700 hover:text-red-900"
                  }`}
                >
                  📚 {question.resource.label} →
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MultipleChoiceOptions({
  options,
  selected,
  onSelect,
  showFeedback,
  correctIndex,
}: {
  options: string[];
  selected: string | null;
  onSelect: (answer: string) => void;
  showFeedback: boolean;
  correctIndex: number;
}) {
  return (
    <div className="space-y-2">
      {options.map((option, i) => {
        const isSelected = selected === String(i);
        const isCorrectOption = i === correctIndex;
        let borderClass = "border-slate-200 hover:border-blue-300 hover:bg-blue-50/50";
        let bgClass = "";

        if (showFeedback) {
          if (isCorrectOption) {
            borderClass = "border-green-300";
            bgClass = "bg-green-50";
          } else if (isSelected && !isCorrectOption) {
            borderClass = "border-red-300";
            bgClass = "bg-red-50";
          }
        } else if (isSelected) {
          borderClass = "border-blue-400";
          bgClass = "bg-blue-50";
        }

        return (
          <button
            key={i}
            onClick={() => !showFeedback && onSelect(String(i))}
            disabled={showFeedback}
            className={`w-full text-left p-3.5 rounded-lg border transition-all ${borderClass} ${bgClass} ${
              showFeedback ? "cursor-default" : "cursor-pointer"
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                  isSelected
                    ? showFeedback
                      ? isCorrectOption
                        ? "border-green-500 bg-green-500 text-white"
                        : "border-red-500 bg-red-500 text-white"
                      : "border-blue-500 bg-blue-500 text-white"
                    : "border-slate-300 text-slate-500"
                }`}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <span className="text-sm text-slate-700 leading-relaxed">{option}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function FillInBlank({
  value,
  onChange,
  placeholder,
  showFeedback,
  isCorrect,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  showFeedback: boolean;
  isCorrect?: boolean;
}) {
  return (
    <div>
      <input
        type="text"
        value={value}
        onChange={(e) => !showFeedback && onChange(e.target.value)}
        placeholder={placeholder}
        disabled={showFeedback}
        className={`w-full px-4 py-3 rounded-lg border text-sm transition-colors ${
          showFeedback
            ? isCorrect
              ? "border-green-300 bg-green-50"
              : "border-red-300 bg-red-50"
            : "border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        } outline-none`}
      />
    </div>
  );
}
