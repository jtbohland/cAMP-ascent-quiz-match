import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { TIERS, getTierIndex } from "./TierUnlockModal.js";

const SUMMIT_MESSAGES = [
  "[Name], you didn't just climb Ascent — you crushed the whole mountain. 🏔️🔥 Now take that trail-tested confidence into the field, and get ready to reach even higher at cAMP 201.",
  "Summit reached, [Name]! 🎉⛺ You packed the reps, powered through the climb, and now you're ready to put those skills to work where it counts most — with customers.",
  "[Name], from Base Camp to the summit, you showed real climbing grit. 🧥💪 Can't wait to see you bring that energy to the field and hit new heights at cAMP 201.",
  "You made it, [Name]! 🌄🚀 The trail was real, the climb was steep, and you earned every step. Now let's put those new skills to work and keep ascending in SF.",
  "[Name], you've officially planted your flag at the summit. 🚩🏔️ That means it's time to take everything you learned on the trail and put it into action in the field.",
  "Base Camp is behind you. The summit is yours. ⛰️👏 [Name], I'm so proud of the climb you made — and I can't wait to see you keep climbing at cAMP 201.",
  "[Name], this wasn't just a hike — it was a full-on ascent. 🌲🧥 You've built the muscle, the mindset, and the product fluency. Now go use it in the field and show what you've got.",
  "Trail complete. Summit secured. Legend status unlocked. 🏕️✨ [Name], you're ready to take these skills out of training mode and into real conversations with customers.",
  "[Name], you climbed with purpose, stayed on pace, and made it all the way to the top. 🧗‍♂️🎯 Now let's see you carry that momentum into cAMP 201 and reach even bigger peaks.",
  "The view from the top looks good on you, [Name]. 😎🏔️ You've done the work, earned the altitude, and built skills that will show up in the field — and at new heights in SF.",
] as const;

interface SummitModalProps {
  userName: string;
  totalXp: number;
  quizzesPassed: number;
  onDismiss: () => void;
}

export default function SummitModal({
  userName,
  totalXp,
  quizzesPassed,
  onDismiss,
}: SummitModalProps) {
  const firstName = userName.split(" ")[0] || "Climber";
  const tierIdx = getTierIndex(totalXp);
  const tier = TIERS[tierIdx];
  const confettiFired = useRef(false);

  // Pick a consistent message based on the user's name (deterministic)
  const messageIndex = userName.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % SUMMIT_MESSAGES.length;
  const personalMessage = SUMMIT_MESSAGES[messageIndex].replace(/\[Name\]/g, firstName);

  // Fire mountain emoji confetti
  useEffect(() => {
    if (confettiFired.current) return;
    confettiFired.current = true;

    const scalar = 2;
    const shape = confetti.shapeFromText({ text: "🏔️", scalar });

    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      if (Date.now() > end) return;

      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        shapes: [shape],
        scalar,
        flat: true,
      });

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
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 my-4">
        {/* Header */}
        <div className="p-8 text-center">
          <div className="text-5xl mb-3">🏔️✨</div>
          <h2 className="text-2xl font-bold text-gray-900">Summit Reached — Ascent Complete!</h2>
          <p className="text-gray-600 mt-2 text-sm">
            You've completed all 15 cAMP Quizzes and conquered your Ascent. The trail behind you is proof — you showed up, engaged, and earned it.
          </p>
        </div>

        {/* Tier + XP Card */}
        <div className="mx-6 p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">{tier.emoji}</span>
              <span className="font-bold text-amber-800">{tier.name}</span>
            </div>
            <p className="text-amber-600 text-xs mt-0.5">Your final tier</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-amber-700">{totalXp} XP</p>
            <p className="text-amber-600 text-xs">total earned</p>
          </div>
        </div>

        {/* What's Next */}
        <div className="px-6 pt-6 pb-2">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">What's Next on Your Journey</h3>

          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0">🎡</span>
                <div>
                  <p className="font-semibold text-gray-800">Keep spinning — Wheel & Deal</p>
                  <p className="text-sm text-gray-600">
                    cAMP 201 will ask you to pitch live. The reps you put in on Wheel & Deal are what make the difference.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0">🧳</span>
                <div>
                  <p className="font-semibold text-gray-800">See you at cAMP 201 in San Francisco!</p>
                  <p className="text-sm text-gray-600">
                    Your in-person capstone — pods, live pitches, real deals, execs, and cross-functional partners. Everything from Ascent comes alive here.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* JT's Message */}
        <div className="px-6 py-4">
          <div className="p-4 border-l-4 border-orange-400 bg-orange-50 rounded-r-lg">
            <p className="text-sm text-gray-700 italic">{personalMessage}</p>
            <p className="text-xs text-gray-500 mt-2">— JT Bohland, Sr. Global Enablement Program Manager</p>
          </div>
        </div>

        {/* CTA */}
        <div className="px-6 pb-6">
          <button
            onClick={onDismiss}
            className="w-full bg-amber-700 hover:bg-amber-800 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            🧠 Back to cAMP Quizzes
          </button>
        </div>
      </div>
    </div>
  );
}
