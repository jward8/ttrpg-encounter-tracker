import { useState } from 'react';
import type { Combatant, CombatantAction, DamageType, CombatLogEntry } from '../../fileSystem/schema';
import type { CommitActionPayload } from '../../store/encounterStore';

const ALL_DAMAGE_TYPES: DamageType[] = [
  'acid', 'bludgeoning', 'cold', 'fire', 'force',
  'lightning', 'necrotic', 'piercing', 'poison',
  'psychic', 'radiant', 'slashing', 'thunder',
];

interface LogEntryModalProps {
  actorId: string;
  action: CombatantAction;
  currentRound: number;
  allCombatants: Combatant[];
  onCommit: (payload: CommitActionPayload) => void;
  onClose: () => void;
}

export default function LogEntryModal({
  actorId,
  action,
  currentRound,
  allCombatants,
  onCommit,
  onClose,
}: LogEntryModalProps) {
  const actor = allCombatants.find(c => c.id === actorId)!;
  const otherCombatants = allCombatants.filter(c => c.id !== actorId);

  const [selectedTargetIds, setSelectedTargetIds] = useState<string[]>([]);
  const [toHitRoll, setToHitRoll] = useState('');
  const [isHit, setIsHit] = useState(true);
  const [damageInput, setDamageInput] = useState('');
  const [damageType, setDamageType] = useState<DamageType>(action.damage_type ?? 'bludgeoning');

  const hasAttackRoll = action.attack_bonus !== undefined;

  function handleToHitChange(value: string) {
    setToHitRoll(value);
    const roll = parseInt(value, 10);
    if (!isNaN(roll) && selectedTargetIds.length === 1) {
      const target = allCombatants.find(c => c.id === selectedTargetIds[0]);
      if (target) {
        setIsHit(roll + (action.attack_bonus ?? 0) >= target.ac);
      }
    }
  }

  function toggleTarget(id: string) {
    setSelectedTargetIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
    // Re-evaluate hit when target changes to a single selection
    const newIds = selectedTargetIds.includes(id)
      ? selectedTargetIds.filter(x => x !== id)
      : [...selectedTargetIds, id];
    const roll = parseInt(toHitRoll, 10);
    if (!isNaN(roll) && newIds.length === 1) {
      const target = allCombatants.find(c => c.id === newIds[0]);
      if (target) setIsHit(roll + (action.attack_bonus ?? 0) >= target.ac);
    }
  }

  function handleCommit() {
    const selectedTargets = allCombatants.filter(c => selectedTargetIds.includes(c.id));
    const parsedDamage = parseInt(damageInput, 10);
    const hasDamage = !isNaN(parsedDamage) && parsedDamage > 0 && (!hasAttackRoll || isHit);
    const parsedToHit = parseInt(toHitRoll, 10);

    const entry: CombatLogEntry = {
      id: crypto.randomUUID(),
      round: currentRound,
      combatant_id: actorId,
      combatant_name: actor.name,
      action_id: action.id,
      action_name: action.name,
      action_category: action.action_category,
      target_ids: selectedTargets.map(t => t.id),
      target_names: selectedTargets.map(t => t.name),
      roll_to_hit: isNaN(parsedToHit) ? undefined : parsedToHit,
      hit: hasAttackRoll ? isHit : undefined,
      damage_amount: hasDamage ? parsedDamage : undefined,
      damage_type: hasDamage ? damageType : undefined,
      timestamp: new Date().toISOString(),
    };

    const payload: CommitActionPayload = {
      actorId,
      actionId: action.id,
      entry,
      damageTargets:
        hasDamage && selectedTargets.length > 0
          ? selectedTargets.map(t => ({ id: t.id, amount: parsedDamage, damageType }))
          : undefined,
      consumeSpellSlotLevel: action.spell_slot_level,
    };

    onCommit(payload);
  }

  const actionStats = [
    action.attack_bonus !== undefined
      ? `${action.attack_bonus >= 0 ? '+' : ''}${action.attack_bonus} to hit`
      : null,
    action.save_dc ? `DC ${action.save_dc} ${action.save_ability}` : null,
    action.damage
      ? `${action.damage}${action.damage_type ? ` ${action.damage_type}` : ''}`
      : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-stone-900 border border-stone-700 rounded-xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-700">
          <h3 className="font-bold text-stone-100">{action.name}</h3>
          <p className="text-sm text-stone-400">{actor.name}</p>
          {actionStats && (
            <p className="text-xs text-stone-500 mt-0.5">{actionStats}</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Targets */}
          <div>
            <p className="text-xs text-stone-400 uppercase tracking-wider mb-2">
              Targets <span className="text-stone-600 normal-case">(optional)</span>
            </p>
            {otherCombatants.length === 0 ? (
              <p className="text-stone-500 text-sm italic">No other combatants</p>
            ) : (
              <div className="space-y-1.5">
                {otherCombatants.map(t => (
                  <label key={t.id} className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedTargetIds.includes(t.id)}
                      onChange={() => toggleTarget(t.id)}
                      className="accent-amber-400 w-4 h-4 rounded shrink-0"
                    />
                    <span className="text-sm text-stone-200 group-hover:text-stone-100">
                      {t.name}
                    </span>
                    <span className="text-xs text-stone-500 ml-auto shrink-0">
                      {t.current_hp}/{t.max_hp} HP · AC {t.ac}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Attack roll (attack actions only) */}
          {hasAttackRoll && (
            <div>
              <p className="text-xs text-stone-400 uppercase tracking-wider mb-2">Attack Roll</p>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    placeholder="d20"
                    value={toHitRoll}
                    onChange={e => handleToHitChange(e.target.value)}
                    className="w-16 bg-stone-700 border border-stone-600 rounded px-2 py-1 text-center text-sm text-stone-100 focus:outline-none focus:border-stone-400"
                  />
                  <span className="text-stone-400 text-sm">
                    {action.attack_bonus! >= 0 ? `+${action.attack_bonus}` : action.attack_bonus}
                  </span>
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isHit}
                    onChange={e => setIsHit(e.target.checked)}
                    className="accent-amber-400 w-4 h-4"
                  />
                  <span className="text-sm text-stone-300">Hit</span>
                </label>
              </div>
            </div>
          )}

          {/* Damage */}
          <div>
            <p className="text-xs text-stone-400 uppercase tracking-wider mb-2">
              Damage <span className="text-stone-600 normal-case">(optional)</span>
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
              <input
                type="number"
                placeholder="0"
                value={damageInput}
                onChange={e => setDamageInput(e.target.value)}
                className="w-16 bg-stone-700 border border-stone-600 rounded px-2 py-1 text-center text-sm text-stone-100 focus:outline-none focus:border-stone-400"
              />
              <select
                value={damageType}
                onChange={e => setDamageType(e.target.value as DamageType)}
                className="bg-stone-700 border border-stone-600 rounded px-2 py-1 text-xs text-stone-200 focus:outline-none focus:border-stone-400"
              >
                {ALL_DAMAGE_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            {selectedTargetIds.length > 0 && parseInt(damageInput, 10) > 0 && (
              <p className="text-xs text-stone-500 mt-1.5">
                Applied to {selectedTargetIds.length} target{selectedTargetIds.length > 1 ? 's' : ''} — resistance/immunity applied automatically
              </p>
            )}
            {hasAttackRoll && !isHit && parseInt(damageInput, 10) > 0 && (
              <p className="text-xs text-amber-600 mt-1.5">Damage skipped on a miss</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-stone-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="text-sm text-stone-400 hover:text-stone-200 px-4 py-2 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCommit}
            className="text-sm bg-amber-600 hover:bg-amber-500 text-white font-semibold px-5 py-2 rounded transition-colors"
          >
            Log Action
          </button>
        </div>
      </div>
    </div>
  );
}
