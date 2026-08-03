import { useEffect, useRef, useState, useCallback } from "react";

interface QuizTimerProps {
  totalSeconds: number;
  onTimeUp: () => void;
  isPaused?: boolean;
}

export default function QuizTimer({ totalSeconds, onTimeUp, isPaused = false }: QuizTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, onTimeUp]);

  const getElapsed = useCallback(() => totalSeconds - secondsLeft, [totalSeconds, secondsLeft]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const percentLeft = (secondsLeft / totalSeconds) * 100;

  const urgency = percentLeft <= 10 ? "text-red-500" : percentLeft <= 25 ? "text-amber-500" : "text-slate-700";

  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ease-linear rounded-full ${
            percentLeft <= 10 ? "bg-red-500" : percentLeft <= 25 ? "bg-amber-500" : "bg-blue-500"
          }`}
          style={{ width: `${percentLeft}%` }}
        />
      </div>
      <span className={`font-mono text-sm font-medium ${urgency}`}>
        {minutes}:{seconds.toString().padStart(2, "0")}
      </span>
    </div>
  );
}

export function useQuizTimer(totalSeconds: number) {
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(() => {
    setIsRunning(false);
    setSecondsLeft(totalSeconds);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [totalSeconds]);
  const getElapsed = useCallback(() => totalSeconds - secondsLeft, [totalSeconds, secondsLeft]);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  return { secondsLeft, isRunning, start, pause, reset, getElapsed, isTimeUp: secondsLeft === 0 };
}
