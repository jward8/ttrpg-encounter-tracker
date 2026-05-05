import { useState } from 'react';
import type { Combatant, CombatantAction, DamageType, SrdCondition } from '../../fileSystem/schema';
import { ARCHETYPES } from '../../engine/archetypes';
import { getRangeReason } from '../../engine/tacticEngine';
import ActionCard from './ActionCard';
import HpTracker from './HpTracker';
import ResourceTracker from './ResourceTracker';
import ConditionBadge from './ConditionBadge';

const SRD_CONDITIONS: SrdCondition[] = [
  'blinded', 'charmed', 'deafened', 'exhaustion', 'frightened',
  'grappled', 'incapacitated', 'invisible', 'paralyzed', 'petrified',
  'poisoned', 'prone', 'restrained', 'stunned', 'unconscious',
];

interface ActionPanelProps {
  combatant: Combatant;
  currentRound: number;
  recommendedActionIds: string[];
  onActionClick?: (action: CombatantAction) => void;
  onDamage?: (amount: number, damageType: DamageType) => void;
  onHeal?: (amount: number) => void;
  onSetTempHp?: (amount: number) => void;
  onReactionUse?: () => void;
  onApplyCondition?: (condition: string) => void;
  onRemoveCondition?: (index: number) => void;
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

export default function ActionPanel({
  combatant,
  currentRound,
  recommendedActionIds,
  onActionClick,
  onDamage,
  onHeal,
  onSetTempHp,
  onReactionUse,
  onApplyCondition,
  onRemoveCondition,
}: ActionPanelProps) {
  const [selectedCondition, setSelectedCondition] = useState<SrdCondition>('blinded');

  const archetypeLabel = combatant.archetype ? ARCHETYPES[combatant.archetype].label : null;
  const archetypeColor = combatant.archetype
    ? (ARCHETYPE_COLORS[combatant.archetype] ?? 'bg-stone-700 text-stone-200 border border-stone-600')
    : null;

  const reactionAvailable =
    combatant.reactions.length > 0 && combatant.reactions[0].available;

  const allResources = [...combatant.actions, ...combatant.bonus_actions];

  function renderActionList(actions: CombatantAction[]) {
    return (
      <div className="flex flex-col gap-2">
        {actions.map(action => (
          <ActionCard
            key={action.id}
            action={action}
            isRecommended={recommendedActionIds.includes(action.id)}
            recommendationReason={
              recommendedActionIds.includes(action.id) ? getRangeReason(action) : undefined
            }
            onClick={onActionClick && action.available ? () => onActionClick(action) : undefined}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-xl font-bold text-stone-100">{combatant.name}</h2>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${TYPE_BADGE[combatant.type]}`}>
            {TYPE_LABEL[combatant.type]}
          </span>
          {archetypeLabel && archetypeColor && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${archetypeColor}`}>
              {archetypeLabel}
            </span>
          )}
        </div>
        <p className="text-sm text-stone-400 mt-0.5">Round {currentRound}</p>
      </div>

      {/* HP */}
      <HpTracker
        currentHp={combatant.current_hp}
        maxHp={combatant.max_hp}
        tempHp={combatant.temp_hp}
        onDamage={onDamage}
        onHeal={onHeal}
        onSetTempHp={onSetTempHp}
      />

      {/* Conditions */}
      <section>
        <p className="text-xs text-stone-400 uppercase tracking-wider mb-2">Conditions</p>
        {combatant.conditions.length > 0 ? (
          <div className="flex flex-wrap gap-1 mb-2">
            {combatant.conditions.map((c, i) => (
              <ConditionBadge
                key={i}
                condition={c.condition}
                onRemove={onRemoveCondition ? () => onRemoveCondition(i) : undefined}
              />
            ))}
          </div>
        ) : (
          <p className="text-stone-600 text-sm italic mb-2">None</p>
        )}
        {onApplyCondition && (
          <div className="flex items-center gap-1.5">
            <select
              value={selectedCondition}
              onChange={e => setSelectedCondition(e.target.value as SrdCondition)}
              className="bg-stone-700 border border-stone-600 rounded px-2 py-1 text-xs text-stone-200 focus:outline-none focus:border-stone-400"
            >
              {SRD_CONDITIONS.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button
              onClick={() => onApplyCondition(selectedCondition)}
              className="text-xs bg-stone-700 hover:bg-stone-600 text-stone-200 px-2.5 py-1.5 rounded border border-stone-600 transition-colors"
            >
              Add
            </button>
          </div>
        )}
      </section>

      {/* Actions */}
      <section>
        <p className="text-xs text-stone-400 uppercase tracking-wider mb-2">Actions</p>
        {combatant.actions.length === 0 ? (
          <p className="text-stone-500 text-sm italic">No actions</p>
        ) : renderActionList(combatant.actions)}
      </section>

      {/* Bonus Actions */}
      {combatant.bonus_actions.length > 0 && (
        <section className="pt-4 border-t border-stone-700">
          <p className="text-xs text-stone-400 uppercase tracking-wider mb-2">Bonus Actions</p>
          {renderActionList(combatant.bonus_actions)}
        </section>
      )}

      {/* Legendary Actions */}
      {combatant.legendary_actions && combatant.legendary_actions.length > 0 && (
        <section className="pt-4 border-t border-stone-700">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-stone-400 uppercase tracking-wider">Legendary Actions</p>
            <span className="text-xs text-amber-400">
              {combatant.legendary_actions_remaining}/{combatant.legendary_actions_max} remaining
            </span>
          </div>
          {renderActionList(combatant.legendary_actions)}
        </section>
      )}

      {/* Reaction */}
      <section className="pt-4 border-t border-stone-700">
        <p className="text-xs text-stone-400 uppercase tracking-wider mb-2">Reaction</p>
        <div className="flex items-center gap-2">
          {onReactionUse && reactionAvailable ? (
            <button
              onClick={onReactionUse}
              className="px-3 py-1 rounded-full text-sm font-medium border bg-emerald-900 text-emerald-300 border-emerald-700 hover:bg-emerald-800 transition-colors"
            >
              Available — Use
            </button>
          ) : (
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${
              reactionAvailable
                ? 'bg-emerald-900 text-emerald-300 border-emerald-700'
                : 'bg-stone-800 text-stone-400 border-stone-600'
            }`}>
              {reactionAvailable ? 'Available' : 'Used'}
            </span>
          )}
          {combatant.reactions[0] && (
            <span className="text-sm text-stone-400">{combatant.reactions[0].name}</span>
          )}
        </div>
      </section>

      {/* Resources */}
      <section className="pt-4 border-t border-stone-700">
        <p className="text-xs text-stone-400 uppercase tracking-wider mb-2">Resources</p>
        <ResourceTracker spellSlots={combatant.spell_slots} actions={allResources} />
      </section>
    </div>
  );
}
