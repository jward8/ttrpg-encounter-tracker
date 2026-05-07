import type { PlayerCharacter } from '../../fileSystem/schema';

interface Props {
  pc: PlayerCharacter;
  onEdit: () => void;
  onRemove: () => void;
  onResetHp: () => void;
}

export default function PartyRosterRow({ pc, onEdit, onRemove, onResetHp }: Props) {
  const classLabel = pc.classes.length > 0
    ? `${pc.classes.join('/')} ${pc.level}`
    : `Level ${pc.level}`;

  const hpClass = pc.current_hp <= 0
    ? 'text-red-400'
    : pc.current_hp < pc.max_hp
      ? 'text-amber-400'
      : 'text-stone-400';

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded border border-stone-700 hover:border-stone-500 transition-colors">
      <span className="text-emerald-300 text-xs font-semibold">PC</span>
      <span className="flex-1 text-sm text-stone-100">{pc.name}</span>
      <span className="text-xs text-stone-500">{classLabel}</span>
      <span className="text-xs text-stone-500">AC {pc.ac}</span>
      <span className={`text-xs ${hpClass}`}>
        {pc.current_hp}{pc.temp_hp > 0 ? ` (+${pc.temp_hp})` : ''} / {pc.max_hp} HP
      </span>
      <button
        onClick={onResetHp}
        className="text-xs text-stone-500 hover:text-stone-200 px-1"
        title="Reset HP / slots / uses to full"
      >
        ↺
      </button>
      <button
        onClick={onEdit}
        className="text-xs text-amber-400 hover:text-amber-300 px-2"
      >
        Edit
      </button>
      <button
        onClick={onRemove}
        className="text-stone-500 hover:text-red-400 text-sm"
        aria-label="Remove"
      >
        ×
      </button>
    </div>
  );
}
