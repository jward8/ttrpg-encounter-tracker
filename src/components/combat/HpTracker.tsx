interface HpTrackerProps {
  currentHp: number;
  maxHp: number;
  tempHp: number;
}

function hpBarColor(current: number, max: number): string {
  const pct = max > 0 ? current / max : 0;
  if (pct <= 0.25) return 'bg-red-600';
  if (pct <= 0.5) return 'bg-yellow-500';
  return 'bg-emerald-500';
}

export default function HpTracker({ currentHp, maxHp, tempHp }: HpTrackerProps) {
  const hpPct = maxHp > 0 ? Math.round((currentHp / maxHp) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-1.5">
        <span className="text-xs text-stone-400 uppercase tracking-wider">HP</span>
        <span className="text-2xl font-bold text-stone-100">{currentHp}</span>
        <span className="text-stone-400 text-lg">/ {maxHp}</span>
        {tempHp > 0 && (
          <span className="text-sm text-sky-400 ml-1">+{tempHp} tmp</span>
        )}
      </div>

      <div className="h-2.5 rounded-full bg-stone-700 overflow-hidden">
        <div
          className={`h-full rounded-full ${hpBarColor(currentHp, maxHp)}`}
          style={{ width: `${hpPct}%` }}
        />
      </div>

      <div className="flex gap-3 pt-1">
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min="0"
            placeholder="0"
            className="w-16 bg-stone-700 border border-stone-600 rounded px-2 py-1 text-center text-sm text-stone-100 focus:outline-none focus:border-stone-400"
          />
          <button className="bg-red-800 hover:bg-red-700 text-white text-xs px-2.5 py-1.5 rounded transition-colors">
            Dmg
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min="0"
            placeholder="0"
            className="w-16 bg-stone-700 border border-stone-600 rounded px-2 py-1 text-center text-sm text-stone-100 focus:outline-none focus:border-stone-400"
          />
          <button className="bg-emerald-800 hover:bg-emerald-700 text-white text-xs px-2.5 py-1.5 rounded transition-colors">
            Heal
          </button>
        </div>
      </div>
    </div>
  );
}
