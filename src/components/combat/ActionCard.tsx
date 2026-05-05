import type { CombatantAction } from '../../fileSystem/schema';

interface ActionCardProps {
  action: CombatantAction;
  isRecommended: boolean;
  recommendationReason?: string;
  confidence?: 'high' | 'medium' | 'low';
  onClick?: () => void;
}

function formatActionStats(action: CombatantAction): string {
  const parts: string[] = [];
  if (action.attack_bonus !== undefined) {
    parts.push(`${action.attack_bonus >= 0 ? '+' : ''}${action.attack_bonus} to hit`);
  }
  if (action.save_dc !== undefined && action.save_ability) {
    parts.push(`DC ${action.save_dc} ${action.save_ability}`);
  }
  if (action.damage) {
    const dmgPart = action.damage_type
      ? `${action.damage} ${action.damage_type}`
      : action.damage;
    parts.push(dmgPart);
  }
  if (action.recharge) {
    parts.push(`Recharge ${action.recharge}`);
  }
  if (action.spell_slot_level !== undefined) {
    parts.push(`Lv${action.spell_slot_level} slot`);
  }
  return parts.join(' · ') || '—';
}

export default function ActionCard({ action, isRecommended, recommendationReason, confidence, onClick }: ActionCardProps) {
  const isUnavailable = !action.available;

  const borderClass = isUnavailable
    ? 'border border-stone-700'
    : isRecommended && confidence === 'medium'
    ? 'border-2 border-dashed border-amber-400'
    : isRecommended
    ? 'border-2 border-amber-400'
    : 'border border-stone-700';

  const interactiveClass =
    !isUnavailable && onClick ? 'cursor-pointer hover:brightness-110' : 'cursor-default';

  return (
    <div
      className={`rounded-lg p-3 bg-stone-800 transition-[filter] ${borderClass} ${interactiveClass} ${isUnavailable ? 'opacity-40' : ''}`}
      onClick={!isUnavailable ? onClick : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium text-stone-100 text-sm">{action.name}</span>
        {isUnavailable ? (
          <span className="text-xs text-stone-500 shrink-0">[SPENT]</span>
        ) : isRecommended ? (
          <span className="text-xs text-amber-400 shrink-0">✦</span>
        ) : null}
      </div>
      <p className="text-xs text-stone-400 mt-0.5">{formatActionStats(action)}</p>
      {isRecommended && recommendationReason && (
        <>
          <hr className="border-stone-600 my-1.5" />
          <p className="text-xs text-amber-300 italic">{recommendationReason}</p>
        </>
      )}
    </div>
  );
}
