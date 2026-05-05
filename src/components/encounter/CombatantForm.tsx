import { useState } from 'react';
import type {
  Archetype, Combatant, CombatantType, DamageType, RangeHint,
} from '../../fileSystem/schema';
import { suggestArchetype } from '../../engine/archetypes';
import ArchetypeSelector from '../tactics/ArchetypeSelector';

const DAMAGE_TYPES: DamageType[] = [
  'acid', 'bludgeoning', 'cold', 'fire', 'force',
  'lightning', 'necrotic', 'piercing', 'poison',
  'psychic', 'radiant', 'slashing', 'thunder',
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
  type: CombatantType;
  ac: string;
  max_hp: string;
  speed: string;
  initiative_modifier: string;
  notes: string;
  archetype: Archetype;
  resistances: DamageType[];
  immunities: DamageType[];
  vulnerabilities: DamageType[];
  actionRows: ActionRow[];
}

function blankRow(): ActionRow {
  return { id: crypto.randomUUID(), name: '', category: 'action', damage: '', range_hint: 'melee', uses_max: '' };
}

function toggleDamageType(arr: DamageType[], type: DamageType): DamageType[] {
  return arr.includes(type) ? arr.filter(t => t !== type) : [...arr, type];
}

interface Props {
  onSubmit: (combatant: Combatant) => void;
  onCancel: () => void;
}

export default function CombatantForm({ onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<FormState>({
    name: '',
    type: 'enemy_npc',
    ac: '',
    max_hp: '',
    speed: '30',
    initiative_modifier: '0',
    notes: '',
    archetype: null,
    resistances: [],
    immunities: [],
    vulnerabilities: [],
    actionRows: [],
  });

  const nameError = form.name.trim() === '';
  const acVal = parseInt(form.ac);
  const hpVal = parseInt(form.max_hp);
  const acError = form.ac !== '' && (isNaN(acVal) || acVal < 1);
  const hpError = form.max_hp !== '' && (isNaN(hpVal) || hpVal < 1);
  const canSubmit = form.name.trim() !== '' && !isNaN(acVal) && acVal >= 1 && !isNaN(hpVal) && hpVal >= 1;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
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

  function handleSuggest() {
    const maxHp = parseInt(form.max_hp) || 0;
    const actionRows = form.actionRows.filter(r => r.category === 'action');
    const partial = {
      legendary_actions_max: 0,
      current_hp: maxHp,
      max_hp: maxHp,
      actions: actionRows.map(r => ({
        id: r.id,
        name: r.name,
        action_category: 'action' as const,
        range_hint: r.range_hint,
        damage: r.damage || undefined,
        available: true,
      })),
      bonus_actions: [],
    } as unknown as Combatant;
    set('archetype', suggestArchetype(partial));
  }

  function handleSubmit() {
    if (!canSubmit) return;
    const maxHp = parseInt(form.max_hp);
    const makeAction = (row: ActionRow) => ({
      id: crypto.randomUUID(),
      name: row.name,
      action_category: row.category as import('../../fileSystem/schema').ActionCategory,
      damage: row.damage || undefined,
      range_hint: row.range_hint,
      uses_max: row.uses_max ? parseInt(row.uses_max) : undefined,
      uses_remaining: row.uses_max ? parseInt(row.uses_max) : undefined,
      available: true,
    });
    const rows = form.actionRows.filter(r => r.name.trim() !== '');
    const combatant: Combatant = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      type: form.type,
      ac: acVal,
      max_hp: maxHp,
      current_hp: maxHp,
      temp_hp: 0,
      speed: parseInt(form.speed) || 30,
      initiative: null,
      initiative_modifier: parseInt(form.initiative_modifier) || 0,
      conditions: [],
      actions: rows.filter(r => r.category === 'action').map(makeAction),
      bonus_actions: rows.filter(r => r.category === 'bonus_action').map(makeAction),
      reactions: rows.filter(r => r.category === 'reaction').map(makeAction),
      spell_slots: {},
      resistances: form.resistances,
      immunities: form.immunities,
      vulnerabilities: form.vulnerabilities,
      legendary_actions_max: 0,
      legendary_actions_remaining: 0,
      archetype: form.archetype,
      notes: form.notes,
    };
    onSubmit(combatant);
  }

  const inputCls = 'bg-stone-800 border border-stone-600 rounded px-2 py-1 text-sm text-stone-100 w-full focus:outline-none focus:border-amber-500';
  const labelCls = 'text-xs text-stone-400 mb-1 block';
  const errorCls = 'text-red-400 text-xs mt-0.5';

  return (
    <div className="bg-stone-900 border border-stone-700 rounded-lg p-4 space-y-4">
      <h3 className="text-sm font-semibold text-amber-400">Add Combatant</h3>

      {/* Name + Type row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Name *</label>
          <input
            className={inputCls}
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="e.g. Goblin Sharpshooter"
          />
          {nameError && form.name !== '' && <p className={errorCls}>Required</p>}
        </div>
        <div>
          <label className={labelCls}>Type *</label>
          <select
            className={inputCls}
            value={form.type}
            onChange={e => set('type', e.target.value as CombatantType)}
          >
            <option value="enemy_npc">Enemy NPC</option>
            <option value="allied_npc">Allied NPC</option>
            <option value="player_character">Player Character</option>
          </select>
        </div>
      </div>

      {/* AC + HP + Speed + Init Mod */}
      <div className="grid grid-cols-4 gap-3">
        <div>
          <label className={labelCls}>AC *</label>
          <input
            className={inputCls}
            type="number"
            min={1}
            value={form.ac}
            onChange={e => set('ac', e.target.value)}
          />
          {acError && <p className={errorCls}>Min 1</p>}
        </div>
        <div>
          <label className={labelCls}>Max HP *</label>
          <input
            className={inputCls}
            type="number"
            min={1}
            value={form.max_hp}
            onChange={e => set('max_hp', e.target.value)}
          />
          {hpError && <p className={errorCls}>Min 1</p>}
        </div>
        <div>
          <label className={labelCls}>Speed</label>
          <input
            className={inputCls}
            type="number"
            min={0}
            value={form.speed}
            onChange={e => set('speed', e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>Init Mod</label>
          <input
            className={inputCls}
            type="number"
            value={form.initiative_modifier}
            onChange={e => set('initiative_modifier', e.target.value)}
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className={labelCls}>Notes</label>
        <textarea
          className={`${inputCls} resize-none`}
          rows={2}
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
        />
      </div>

      {/* Archetype */}
      <div>
        <label className={labelCls}>Archetype</label>
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <ArchetypeSelector
              value={form.archetype}
              onChange={a => set('archetype', a)}
            />
          </div>
          <button
            type="button"
            onClick={handleSuggest}
            className="text-xs px-2.5 py-1.5 rounded border border-stone-600 text-stone-400 hover:text-stone-200 hover:border-stone-500 transition-colors shrink-0"
          >
            Suggest
          </button>
        </div>
      </div>

      {/* Damage traits */}
      {(['resistances', 'immunities', 'vulnerabilities'] as const).map(trait => (
        <div key={trait}>
          <label className={labelCls}>{trait.charAt(0).toUpperCase() + trait.slice(1)}</label>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {DAMAGE_TYPES.map(dt => (
              <label key={dt} className="flex items-center gap-1 text-xs text-stone-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form[trait].includes(dt)}
                  onChange={() => set(trait, toggleDamageType(form[trait], dt))}
                  className="accent-amber-500"
                />
                {dt}
              </label>
            ))}
          </div>
        </div>
      ))}

      {/* Actions */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={labelCls + ' mb-0'}>Actions</label>
          <button
            type="button"
            onClick={addRow}
            className="text-xs text-amber-400 hover:text-amber-300"
          >
            + Add Action
          </button>
        </div>
        {form.actionRows.length === 0 && (
          <p className="text-xs text-stone-600 italic">No actions added.</p>
        )}
        <div className="space-y-2">
          {form.actionRows.map(row => (
            <div key={row.id} className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-2 items-center">
              <input
                className={inputCls}
                placeholder="Action name"
                value={row.name}
                onChange={e => updateRow(row.id, { name: e.target.value })}
              />
              <select
                className={inputCls}
                value={row.category}
                onChange={e => updateRow(row.id, { category: e.target.value as ActionCategory })}
              >
                <option value="action">Action</option>
                <option value="bonus_action">Bonus</option>
                <option value="reaction">Reaction</option>
              </select>
              <input
                className={`${inputCls} w-20`}
                placeholder="Damage"
                value={row.damage}
                onChange={e => updateRow(row.id, { damage: e.target.value })}
              />
              <select
                className={inputCls}
                value={row.range_hint}
                onChange={e => updateRow(row.id, { range_hint: e.target.value as RangeHint })}
              >
                {RANGE_HINTS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <input
                className={`${inputCls} w-16`}
                type="number"
                min={1}
                placeholder="Uses"
                value={row.uses_max}
                onChange={e => updateRow(row.id, { uses_max: e.target.value })}
              />
              <button
                type="button"
                onClick={() => removeRow(row.id)}
                className="text-stone-500 hover:text-red-400 text-sm"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Submit / Cancel */}
      <div className="flex justify-end gap-2 pt-2 border-t border-stone-700">
        <button
          type="button"
          onClick={onCancel}
          className="text-xs px-3 py-1.5 rounded border border-stone-600 text-stone-400 hover:text-stone-200 hover:border-stone-500 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="text-xs px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Add Combatant
        </button>
      </div>
    </div>
  );
}
