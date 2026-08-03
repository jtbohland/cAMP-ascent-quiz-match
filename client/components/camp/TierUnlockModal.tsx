import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";

const TIERS = [
  { name: "Base Camper", emoji: "🏕️", min: 0, max: 75 },
  { name: "Trailblazer", emoji: "🥾", min: 76, max: 150 },
  { name: "Summit Seeker", emoji: "🧗🏼", min: 151, max: 234 },
  { name: "Pinnacle Achiever", emoji: "🏔️✨", min: 235, max: Infinity },
] as const;

function getTierIndex(xp: number): number {
  if (xp >= 235) return 3;
  if (xp >= 151) return 2;
  if (xp >= 76) return 1;
  return 0;
}

function getXpToNextTier(xp: number): number | null {
  const tierIdx = getTierIndex(xp);
  if (tierIdx >= 3) return null; // Already at top
  return TIERS[tierIdx + 1].min - xp;
}

interface TierUnlockModalProps {
  tierIndex: number;
  totalXp: number;
  leaderboardPosition: number;
  onDismiss: () => void;
}

export default function TierUnlockModal({
  tierIndex,
  totalXp,
  leaderboardPosition,
  onDismiss,
}: TierUnlockModalProps) {
  const tier = TIERS[tierIndex] ?? TIERS[0];
  const xpToNext = getXpToNextTier(totalXp);
  const nextTier = tierIndex < 3 ? TIERS[tierIndex + 1] : null;
  const confettiFired = useRef(false);

  // Fire tier emoji confetti on mount
  useEffect(() => {
    if (confettiFired.current) return;
    confettiFired.current = true;

    const tierEmoji = tier.emoji;
    // Use shapeFromText for emoji confetti
    const scalar = 2;
    const shape = confetti.shapeFromText({ text: tierEmoji, scalar });

    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      if (Date.now() > end) return;

      // Left side burst
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        shapes: [shape],
        scalar,
        flat: true,
      });

      // Right side burst
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        shapes: [shape],
        scalar,
        flat: true,
      });

      requestAnimationFrame(frame);
    };

    frame();
  }, [tier.emoji]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-5 text-center">
          <h2 className="text-xl font-bold text-white tracking-wide">NEW ACHIEVEMENT!</h2>
          <p className="text-purple-100 text-sm mt-1">You unlocked a new tier</p>
        </div>

        {/* Tier Display */}
        <div className="p-6 text-center">
          <div className="text-5xl mb-3">{tier.emoji}</div>
          <h3 className="text-2xl font-bold text-gray-900">{tier.name}</h3>
          <p className="text-gray-500 mt-1">{totalXp} XP earned</p>
        </div>

        {/* Stats */}
        <div className="px-6 pb-4 space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏆</span>
              <span className="text-sm text-gray-700">Leaderboard position</span>
            </div>
            <span className="font-bold text-indigo-600">
              {leaderboardPosition === 1
                ? "1st"
                : leaderboardPosition === 2
                  ? "2nd"
                  : leaderboardPosition === 3
                    ? "3rd"
                    : `${leaderboardPosition}th`}
            </span>
          </div>

          {xpToNext !== null && nextTier && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-lg">{nextTier.emoji}</span>
                <span className="text-sm text-gray-700">XP to unlock {nextTier.name}</span>
              </div>
              <span className="font-bold text-amber-600">{xpToNext} XP</span>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="px-6 pb-6">
          <button
            onClick={onDismiss}
            className="w-full bg-gray-100 hover:bg-gray-200 text-amber-700 font-semibold py-3 rounded-lg transition-colors"
          >
            ⭐ Keep Climbing Quizzes
          </button>
        </div>
      </div>
    </div>
  );
}

export { TIERS, getTierIndex, getXpToNextTier };
