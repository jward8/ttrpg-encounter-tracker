interface ConditionBadgeProps {
  condition: string;
}

const CONDITION_COLORS: Record<string, string> = {
  paralyzed: 'bg-purple-700 text-purple-100',
  stunned: 'bg-purple-700 text-purple-100',
  unconscious: 'bg-purple-700 text-purple-100',
  incapacitated: 'bg-purple-700 text-purple-100',
  petrified: 'bg-purple-700 text-purple-100',
  prone: 'bg-orange-700 text-orange-100',
  grappled: 'bg-orange-700 text-orange-100',
  restrained: 'bg-orange-700 text-orange-100',
  blinded: 'bg-rose-700 text-rose-100',
  charmed: 'bg-rose-700 text-rose-100',
  frightened: 'bg-rose-700 text-rose-100',
  deafened: 'bg-rose-700 text-rose-100',
  poisoned: 'bg-teal-700 text-teal-100',
  exhaustion: 'bg-teal-700 text-teal-100',
  invisible: 'bg-teal-700 text-teal-100',
};

export default function ConditionBadge({ condition }: ConditionBadgeProps) {
  const colorClass = CONDITION_COLORS[condition] ?? 'bg-stone-600 text-stone-100';
  return (
    <span
      title={condition}
      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${colorClass}`}
    >
      {condition.slice(0, 4)}
    </span>
  );
}
