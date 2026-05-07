import { useState } from 'react';
import type {
  AbilityName, AbilityScores, CombatantAction, DamageType, PlayerCharacter,
  RangeHint,
} from '../../fileSystem/schema';

const DAMAGE_TYPES: DamageType[] = [
  'acid', 'bludgeoning', 'cold', 'fire', 'force',
  'lightning', 'necrotic', 'piercing', 'poison',
  'psychic', 'radiant', 'slashing', 'thunder',
];

const ABILITY_NAMES: AbilityName[] = [
  'strength', 'dexterity', 'constitution',
  'intelligence', 'wisdom', 'charisma',
];

const RANGE_HINTS: RangeHint[] = [
  'melee', 'ranged_30', 'ranged_60', 'ranged_120', 'self', 'touch', 'area', 'any',
];

type ActionCategory = 'action' | 'bonus_action' | 'reaction';

interface ActionRow {
  id: string;
  name: string;
  category: ActionCategory;
  damage: string;
  range_hint: RangeHint;
  uses_max: string;
}

interface FormState {
  name: string;
  player_name: string;
  classes: string;             // comma-separated input
  level: string;
  ac: string;
  max_hp: string;
  current_hp: string;
  temp_hp: string;
  speed: string;
  initiative_modifier: string;
  proficiency_bonus: string;
  passive_perception: string;
  ability_scores: Record<AbilityName, string>;
  save_proficiencies: AbilityName[];
  resistances: DamageType[];
  immunities: DamageType[];
  vulnerabilities: DamageType[];
  notes: string;
  actionRows: ActionRow[];
}

function blankRow(): ActionRow {
  return { id: crypto.randomUUID(), name: '', category: 'action', damage: '', range_hint: 'melee', uses_max: '' };
}

function pcToForm(pc: PlayerCharacter | null): FormState {
  const scores = pc?.ability_scores ?? {
    strength: 10, dexterity: 10, constitution: 10,
    intelligence: 10, wisdom: 10, charisma: 10,
  };
  const allActions = [
    ...(pc?.actions ?? []).map(a => ({ ...a, _cat: 'action' as ActionCategory })),
    ...(pc?.bonus_actions ?? []).map(a => ({ ...a, _cat: 'bonus_action' as ActionCategory })),
    ...(pc?.reactions ?? []).map(a => ({ ...a, _cat: 'reaction' as ActionCategory })),
  ];
  return {
    name: pc?.name ?? '',
    player_name: pc?.player_name ?? '',
    classes: (pc?.classes ?? []).join(', '),
    level: String(pc?.level ?? 1),
    ac: String(pc?.ac ?? ''),
    max_hp: String(pc?.max_hp ?? ''),
    current_hp: String(pc?.current_hp ?? pc?.max_hp ?? ''),
    temp_hp: String(pc?.temp_hp ?? 0),
    speed: String(pc?.speed ?? 30),
    initiative_modifier: String(pc?.initiative_modifier ?? 0),
    proficiency_bonus: String(pc?.proficiency_bonus ?? 2),
    passive_perception: String(pc?.passive_perception ?? 10),
    ability_scores: {
      strength: String(scores.strength),
      dexterity: String(scores.dexterity),
      constitution: String(scores.constitution),
      intelligence: String(scores.intelligence),
      wisdom: String(scores.wisdom),
      charisma: String(scores.charisma),
    },
    save_proficiencies: pc?.save_proficiencies ?? [],
    resistances: pc?.resistances ?? [],
    immunities: pc?.immunities ?? [],
    vulnerabilities: pc?.vulnerabilities ?? [],
    notes: pc?.notes ?? '',
    actionRows: allActions.map(a => ({
      id: a.id,
      name: a.name,
      category: a._cat,
      damage: a.damage ?? '',
      range_hint: a.range_hint,
      uses_max: a.uses_max != null ? String(a.uses_max) : '',
    })),
  };
}

interface Props {
  initial: PlayerCharacter | null;   // null = create mode
  onSubmit: (pc: PlayerCharacter) => void;
  onCancel: () => void;
}

export default function PlayerCharacterForm({ initial, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<FormState>(() => pcToForm(initial));

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function setAbility(name: AbilityName, value: string) {
    setForm(prev => ({
      ...prev,
      ability_scores: { ...prev.ability_scores, [name]: value },
    }));
  }

  function toggleSave(name: AbilityName) {
    setForm(prev => ({
      ...prev,
      save_proficiencies: prev.save_proficiencies.includes(name)
        ? prev.save_proficiencies.filter(n => n !== name)
        : [...prev.save_proficiencies, name],
    }));
  }

  function toggleDamageType(trait: 'resistances' | 'immunities' | 'vulnerabilities', type: DamageType) {
    setForm(prev => ({
      ...prev,
      [trait]: prev[trait].includes(type)
        ? prev[trait].filter(t => t !== type)
        : [...prev[trait], type],
    }));
  }

  function addRow() {
    setForm(prev => ({ ...prev, actionRows: [...prev.actionRows, blankRow()] }));
  }
  function removeRow(id: string) {
    setForm(prev => ({ ...prev, actionRows: prev.actionRows.filter(r => r.id !== id) }));
  }
  function updateRow(id: string, patch: Partial<ActionRow>) {
    setForm(prev => ({
      ...prev,
      actionRows: prev.actionRows.map(r => r.id === id ? { ...r, ...patch } : r),
    }));
  }

  // Validation
  const ac = parseInt(form.ac);
  const max_hp = parseInt(form.max_hp);
  const canSubmit =
    form.name.trim() !== '' &&
    !isNaN(ac) && ac >= 1 &&
    !isNaN(max_hp) && max_hp >= 1;

  function handleSubmit() {
    if (!canSubmit) return;
    const makeAction = (row: ActionRow): CombatantAction => ({
      id: row.id,
      name: row.name,
      action_category: row.category,
      damage: row.damage || undefined,
      range_hint: row.range_hint,
      uses_max: row.uses_max ? parseInt(row.uses_max) : undefined,
      uses_remaining: row.uses_max ? parseInt(row.uses_max) : undefined,
      available: true,
    });
    const rows = form.actionRows.filter(r => r.name.trim() !== '');
    const ability_scores: AbilityScores = {
      strength: parseInt(form.ability_scores.strength) || 10,
      dexterity: parseInt(form.ability_scores.dexterity) || 10,
      constitution: parseInt(form.ability_scores.constitution) || 10,
      intelligence: parseInt(form.ability_scores.intelligence) || 10,
      wisdom: parseInt(form.ability_scores.wisdom) || 10,
      charisma: parseInt(form.ability_scores.charisma) || 10,
    };
    const result: PlayerCharacter = {
      id: initial?.id ?? crypto.randomUUID(),
      name: form.name.trim(),
      player_name: form.player_name.trim(),
      classes: form.classes.split(',').map(c => c.trim()).filter(Boolean),
      level: parseInt(form.level) || 1,
      ac,
      max_hp,
      current_hp: parseInt(form.current_hp) || max_hp,
      temp_hp: parseInt(form.temp_hp) || 0,
      initiative_modifier: parseInt(form.initiative_modifier) || 0,
      speed: parseInt(form.speed) || 30,
      spell_slots: initial?.spell_slots ?? {},
      actions: rows.filter(r => r.category === 'action').map(makeAction),
      bonus_actions: rows.filter(r => r.category === 'bonus_action').map(makeAction),
      reactions: rows.filter(r => r.category === 'reaction').map(makeAction),
      ability_scores,
      save_proficiencies: form.save_proficiencies,
      proficiency_bonus: parseInt(form.proficiency_bonus) || 2,
      passive_perception: parseInt(form.passive_perception) || 10,
      resistances: form.resistances,
      immunities: form.immunities,
      vulnerabilities: form.vulnerabilities,
      notes: form.notes,
      imported_from: initial?.imported_from ?? 'manual',
    };
    onSubmit(result);
  }

  const inputCls = 'bg-stone-800 border border-stone-600 rounded px-2 py-1 text-sm text-stone-100 w-full focus:outline-none focus:border-amber-500';
  const labelCls = 'text-xs text-stone-400 mb-1 block';

  return (
    <div className="bg-stone-900 border border-stone-700 rounded-lg p-4 space-y-4">
      <h3 className="text-sm font-semibold text-amber-400">
        {initial ? 'Edit Player Character' : 'Add Player Character'}
      </h3>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Character Name *</label>
          <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Player Name</label>
          <input className={inputCls} value={form.player_name} onChange={e => set('player_name', e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Classes (comma-separated)</label>
          <input className={inputCls} placeholder="e.g. Wizard, Cleric" value={form.classes} onChange={e => set('classes', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Level</label>
          <input className={inputCls} type="number" min={1} max={20} value={form.level} onChange={e => set('level', e.target.value)} />
        </div>
      </div>

      {/* Continued in Task 8b */}
      <div className="flex justify-end gap-2 pt-2 border-t border-stone-700">
        <button type="button" onClick={onCancel} className="text-xs px-3 py-1.5 rounded border border-stone-600 text-stone-400 hover:text-stone-200 hover:border-stone-500 transition-colors">
          Cancel
        </button>
        <button type="button" onClick={handleSubmit} disabled={!canSubmit} className="text-xs px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          {initial ? 'Save' : 'Add to Roster'}
        </button>
      </div>
    </div>
  );
}
