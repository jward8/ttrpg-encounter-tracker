import type { SpellSlots, CombatantAction } from '../../fileSystem/schema';

interface ResourceTrackerProps {
  spellSlots: SpellSlots;
  actions: CombatantAction[];
}

export default function ResourceTracker({ spellSlots, actions }: ResourceTrackerProps) {
  const slotEntries = Object.entries(spellSlots)
    .map(([key, slot]) => ({ level: Number(key), max: slot.max, remaining: slot.remaining }))
    .filter(s => s.max > 0)
    .sort((a, b) => a.level - b.level);

  const limitedActions = actions.filter(
    a => a.uses_max !== undefined || a.recharge !== undefined,
  );

  if (slotEntries.length === 0 && limitedActions.length === 0) {
    return <p className="text-stone-500 text-sm italic">No resources</p>;
  }

  return (
    <div className="space-y-4">
      {slotEntries.length > 0 && (
        <div>
          <p className="text-xs text-stone-400 uppercase tracking-wider mb-2">Spell Slots</p>
          <div className="space-y-1.5">
            {slotEntries.map(({ level, max, remaining }) => (
              <div key={level} className="flex items-center gap-3">
                <span className="text-xs text-stone-400 w-7 shrink-0">Lv{level}</span>
                <div className="flex gap-0.5">
                  {Array.from({ length: max }).map((_, i) => (
                    <span
                      key={i}
                      className={`text-sm leading-none ${i < remaining ? 'text-amber-400' : 'text-stone-600'}`}
                    >
                      {i < remaining ? '●' : '○'}
                    </span>
                  ))}
                </div>
                <span className="text-xs text-stone-500">{remaining}/{max}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {limitedActions.length > 0 && (
        <div>
          <p className="text-xs text-stone-400 uppercase tracking-wider mb-2">Limited Uses</p>
          <div className="space-y-1">
            {limitedActions.map(action => (
              <div key={action.id} className="flex items-center justify-between gap-2">
                <span className="text-sm text-stone-300">{action.name}</span>
                {action.recharge ? (
                  <span className="text-xs text-stone-400 shrink-0">⟳ {action.recharge}</span>
                ) : (
                  <span className="text-xs text-stone-400 font-mono shrink-0">
                    [{action.uses_remaining ?? 0}/{action.uses_max}]
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
