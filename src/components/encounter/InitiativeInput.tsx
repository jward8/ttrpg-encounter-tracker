import { useMemo, useState } from 'react';
import { useEncounterStore } from '../../store/encounterStore';

export default function InitiativeInput() {
  const encounter = useEncounterStore(s => s.encounter);
  const setAllInitiatives = useEncounterStore(s => s.setAllInitiatives);
  const startCombat = useEncounterStore(s => s.startCombat);
  const setEncounterStatus = useEncounterStore(s => s.setEncounterStatus);

  const [inputValues, setInputValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(encounter.combatants.map(c => [c.id, ''])),
  );

  const sortedCombatants = useMemo(() => {
    return [...encounter.combatants].sort((a, b) => {
      const av = parseFloat(inputValues[a.id] ?? '') || -Infinity;
      const bv = parseFloat(inputValues[b.id] ?? '') || -Infinity;
      return bv - av;
    });
  }, [encounter.combatants, inputValues]);

  const hasAnyValue = Object.values(inputValues).some(
    v => v.trim() !== '' && !isNaN(parseFloat(v)),
  );

  function handleStart() {
    const parsed: Record<string, number> = {};
    for (const [id, val] of Object.entries(inputValues)) {
      const n = parseFloat(val);
      if (!isNaN(n)) parsed[id] = n;
    }
    setAllInitiatives(parsed);
    startCombat();
  }

  const typeBadge = (type: string) => {
    if (type === 'player_character') return 'bg-emerald-900 text-emerald-300';
    if (type === 'allied_npc') return 'bg-blue-900 text-blue-300';
    return 'bg-red-900 text-red-300';
  };

  const typeLabel = (type: string) => {
    if (type === 'player_character') return 'PC';
    if (type === 'allied_npc') return 'Ally';
    return 'Enemy';
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full">
        <h2 className="text-lg font-semibold text-amber-400 mb-1">Roll Initiative</h2>
        <p className="text-xs text-stone-500 mb-6">
          Enter initiative rolls. The list updates live in turn order.
        </p>

        <div className="space-y-2">
          {sortedCombatants.map((c, i) => (
            <div
              key={c.id}
              className="flex items-center gap-3 bg-stone-900 border border-stone-700 rounded-lg px-4 py-2"
            >
              <span className="text-xs text-stone-600 w-4 text-right">{i + 1}</span>
              <span
                className={`text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded ${typeBadge(c.type)}`}
              >
                {typeLabel(c.type)}
              </span>
              <span className="flex-1 text-sm text-stone-100">{c.name}</span>
              <span className="text-xs text-stone-500">
                Mod {c.initiative_modifier >= 0 ? '+' : ''}{c.initiative_modifier}
              </span>
              <input
                type="number"
                value={inputValues[c.id] ?? ''}
                onChange={e =>
                  setInputValues(prev => ({ ...prev, [c.id]: e.target.value }))
                }
                placeholder="—"
                className="w-16 text-center bg-stone-800 border border-stone-600 rounded px-2 py-1 text-sm text-stone-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="shrink-0 border-t border-stone-700 bg-stone-900 px-6 py-3 flex justify-between items-center">
        <button
          onClick={() => setEncounterStatus('setup')}
          className="text-xs px-3 py-1.5 rounded border border-stone-600 text-stone-400 hover:text-stone-200 hover:border-stone-500 transition-colors"
        >
          ← Back to Setup
        </button>
        <button
          onClick={handleStart}
          disabled={!hasAnyValue}
          className="text-sm px-4 py-2 rounded bg-amber-600 hover:bg-amber-500 text-white font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Start Combat
        </button>
      </div>
    </div>
  );
}
