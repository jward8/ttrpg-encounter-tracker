import type { Archetype } from '../../fileSystem/schema';
import { ARCHETYPES } from '../../engine/archetypes';

const ARCHETYPE_KEYS = Object.keys(ARCHETYPES) as Exclude<Archetype, null>[];

interface Props {
  value: Archetype;
  onChange: (a: Archetype) => void;
  suggestedArchetype?: Archetype;
}

export default function ArchetypeSelector({ value, onChange, suggestedArchetype }: Props) {
  const selectCls = 'bg-stone-800 border border-stone-600 rounded px-2 py-1 text-sm text-stone-100 w-full focus:outline-none focus:border-amber-500';

  return (
    <div className="space-y-1">
      <select
        className={selectCls}
        value={value ?? ''}
        onChange={e => onChange((e.target.value || null) as Archetype)}
      >
        <option value="">None</option>
        {ARCHETYPE_KEYS.map(key => (
          <option key={key} value={key}>
            {ARCHETYPES[key].label}{suggestedArchetype === key ? ' (suggested)' : ''}
          </option>
        ))}
      </select>
      {value && (
        <p className="text-xs text-stone-400 italic pl-0.5">
          {ARCHETYPES[value].description}
        </p>
      )}
    </div>
  );
}
