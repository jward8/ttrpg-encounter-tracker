import type { Archetype } from '../../fileSystem/schema';
import { ARCHETYPES } from '../../engine/archetypes';

const ARCHETYPE_COLORS: Record<string, string> = {
  boss: 'bg-red-900 text-red-200 border border-red-700',
  brute: 'bg-orange-900 text-orange-200 border border-orange-700',
  glass_cannon: 'bg-purple-900 text-purple-200 border border-purple-700',
  skirmisher: 'bg-sky-900 text-sky-200 border border-sky-700',
  controller: 'bg-indigo-900 text-indigo-200 border border-indigo-700',
  support: 'bg-emerald-900 text-emerald-200 border border-emerald-700',
  protector: 'bg-blue-900 text-blue-200 border border-blue-700',
  survivor: 'bg-yellow-900 text-yellow-200 border border-yellow-700',
};

interface Props {
  archetype: Archetype;
  size?: 'sm' | 'xs';
}

export default function ArchetypeBadge({ archetype, size = 'xs' }: Props) {
  if (!archetype) return null;
  const color = ARCHETYPE_COLORS[archetype] ?? 'bg-stone-700 text-stone-200 border border-stone-600';
  const label = ARCHETYPES[archetype].label;
  const cls = size === 'sm'
    ? 'px-2 py-0.5 rounded-full text-xs font-medium'
    : 'px-1.5 py-0.5 rounded-full text-[10px] font-medium';
  return (
    <span className={`${cls} ${color}`}>{label}</span>
  );
}

export { ARCHETYPE_COLORS };
