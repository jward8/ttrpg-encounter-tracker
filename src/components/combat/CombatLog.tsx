import type { CombatLogEntry } from '../../fileSystem/schema';

interface CombatLogProps {
  entries: CombatLogEntry[];
}

function formatEntry(entry: CombatLogEntry): string {
  let text = entry.action_name;
  if (entry.target_names.length > 0) {
    text += ` → ${entry.target_names.join(', ')}`;
  }
  if (entry.hit === false) {
    text += ' · Miss';
  } else if (entry.damage_amount !== undefined) {
    text += ` · ${entry.damage_amount}`;
    if (entry.damage_type) text += ` ${entry.damage_type}`;
  }
  if (entry.conditions_applied && entry.conditions_applied.length > 0) {
    text += ` [${entry.conditions_applied.join(', ')}]`;
  }
  return text;
}

export default function CombatLog({ entries }: CombatLogProps) {
  const roundMap = new Map<number, CombatLogEntry[]>();
  for (const entry of entries) {
    const group = roundMap.get(entry.round) ?? [];
    group.push(entry);
    roundMap.set(entry.round, group);
  }
  const sortedRounds = Array.from(roundMap.keys()).sort((a, b) => a - b);

  return (
    <div className="h-full overflow-y-auto flex flex-col-reverse">
      <div className="flex flex-col px-3 py-2">
        {sortedRounds.map((round, roundIndex) => (
          <div key={round}>
            {roundIndex > 0 && <hr className="border-stone-700 my-1" />}
            {(roundMap.get(round) ?? []).map(entry => (
              <div key={entry.id} className="flex items-start gap-1.5 py-0.5">
                <span className="text-[10px] text-stone-500 shrink-0 mt-0.5 font-mono">
                  [R{entry.round}]
                </span>
                <span className="text-xs text-stone-200 font-medium shrink-0">
                  {entry.combatant_name}
                </span>
                <span className="text-xs text-stone-500">—</span>
                <span className={`text-xs ${entry.hit === false ? 'text-stone-500 line-through' : 'text-stone-400'}`}>
                  {formatEntry(entry)}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
