import type { Combatant } from '../../fileSystem/schema';
import ConditionBadge from './ConditionBadge';
import ArchetypeBadge from '../tactics/ArchetypeBadge';

interface CombatantCardProps {
  combatant: Combatant;
  isCurrentTurn: boolean;
  isNextTurn: boolean;
  isSelected: boolean;
  onClick?: () => void;
}

const TYPE_BADGE: Record<string, string> = {
  player_character: 'bg-sky-700 text-sky-100',
  allied_npc: 'bg-emerald-700 text-emerald-100',
  enemy_npc: 'bg-red-800 text-red-100',
};

const TYPE_LABEL: Record<string, string> = {
  player_character: 'PC',
  allied_npc: 'ALLY',
  enemy_npc: 'ENEMY',
};

function hpBarColor(current: number, max: number): string {
  const pct = max > 0 ? current / max : 0;
  if (pct <= 0.25) return 'bg-red-600';
  if (pct <= 0.5) return 'bg-yellow-500';
  return 'bg-emerald-500';
}

export default function CombatantCard({
  combatant,
  isCurrentTurn,
  isNextTurn,
  isSelected,
  onClick,
}: CombatantCardProps) {
  const isDead = combatant.current_hp === 0;
  const hpPct = combatant.max_hp > 0
    ? Math.round((combatant.current_hp / combatant.max_hp) * 100)
    : 0;

  const containerClass = isCurrentTurn
    ? 'border-2 border-amber-400 bg-amber-950/30'
    : isSelected
    ? 'border-2 border-sky-500 bg-sky-950/20'
    : isNextTurn
    ? 'border border-stone-500 bg-stone-800/80'
    : 'border border-stone-700 bg-stone-800';

  return (
    <div
      className={`rounded-lg p-3 cursor-pointer transition-colors ${containerClass} ${isDead ? 'opacity-60' : ''}`}
      onClick={onClick ?? (() => {})}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`shrink-0 px-1 py-0.5 rounded text-[10px] font-bold uppercase ${TYPE_BADGE[combatant.type]}`}>
            {TYPE_LABEL[combatant.type]}
          </span>
          <span className="font-semibold text-stone-100 text-sm truncate">{combatant.name}</span>
        </div>
        <span className="text-stone-400 text-xs shrink-0">AC {combatant.ac}</span>
      </div>

      <div className="mt-1.5 flex items-center gap-2">
        <span className="text-sm text-stone-200">
          {combatant.current_hp}
          <span className="text-stone-400">/{combatant.max_hp}</span>
        </span>
        {combatant.temp_hp > 0 && (
          <span className="text-xs text-sky-400">(+{combatant.temp_hp} tmp)</span>
        )}
        <ArchetypeBadge archetype={combatant.archetype} />
      </div>

      <div className="mt-1 h-1.5 rounded-full bg-stone-700 overflow-hidden">
        <div
          className={`h-full rounded-full ${hpBarColor(combatant.current_hp, combatant.max_hp)}`}
          style={{ width: `${hpPct}%` }}
        />
      </div>

      {combatant.conditions.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {combatant.conditions.map((c, i) => (
            <ConditionBadge key={i} condition={c.condition} />
          ))}
        </div>
      )}

      {isNextTurn && !isCurrentTurn && (
        <p className="mt-1 text-xs text-stone-400">▶ Next</p>
      )}
    </div>
  );
}
