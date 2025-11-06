import { useEffect, useState } from "react";
import { motion } from "motion/react";


export function PlaybackProgress({
  isPlaying,
  startedAt,
  durationMs,
}: { isPlaying: boolean; startedAt: number | null; durationMs: number }) {
  const [clock, setClock] = useState(Date.now());
  useEffect(() => {
    let id: any;
    const loop = () => { setClock(Date.now()); id = setTimeout(loop, 500); };
    loop();
    return () => clearTimeout(id);
  }, []);

  const elapsed = !isPlaying || !startedAt ? 0 : Math.max(0, clock - startedAt);
  const clamped = durationMs ? Math.min(elapsed, durationMs) : elapsed;
  const pct = durationMs ? Math.min(100, (clamped / durationMs) * 100) : 0;
  const fmt = (ms: number) => {
    const s = Math.floor(ms / 1000); const mm = Math.floor(s / 60); const ss = s % 60;
    return `${mm}:${ss.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mt-3">
      <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
        <div className="h-2 bg-[#1DB954]" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>{fmt(clamped)}</span>
        <span>{durationMs ? fmt(durationMs) : '--:--'}</span>
      </div>
      {!isPlaying && <div className="text-xs text-gray-500 mt-1">Paused</div>}
    </div>
  );
}
