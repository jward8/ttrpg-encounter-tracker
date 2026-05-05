import { useState } from 'react';
import type { Archetype, Combatant, CombatantAction, DamageType, SrdCondition } from '../../fileSystem/schema';
import type { RecommendedAction } from '../../engine/tacticEngine';
import { suggestArchetype } from '../../engine/archetypes';
import ActionCard from './ActionCard';
import HpTracker from './HpTracker';
import ResourceTracker from './ResourceTracker';
import ConditionBadge from './ConditionBadge';
import ArchetypeBadge from '../tactics/ArchetypeBadge';
import ArchetypeSelector from '../tactics/ArchetypeSelector';

const SRD_CONDITIONS: SrdCondition[] = [
  'blinded', 'charmed', 'deafened', 'exhaustion', 'frightened',
  'grappled', 'incapacitated', 'invisible', 'paralyzed', 'petrified',
  'poisoned', 'prone', 'restrained', 'stunned', 'unconscious',
];

interface ActionPanelProps {
  combatant: Combatant;
  currentRound: number;
  recommendedActions: RecommendedAction[];
  onActionClick?: (action: CombatantAction) => void;
  onDamage?: (amount: number, damageType: DamageType) => void;
  onHeal?: (amount: number) => void;
  onSetTempHp?: (amount: number) => void;
  onReactionUse?: () => void;
  onApplyCondition?: (condition: string) => void;
  onRemoveCondition?: (index: number) => void;
  onSetArchetype?: (archetype: Archetype) => void;
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


export default function ActionPanel({
  combatant,
  currentRound,
  recommendedActions,
  onActionClick,
  onDamage,
  onHeal,
  onSetTempHp,
  onReactionUse,
  onApplyCondition,
  onRemoveCondition,
  onSetArchetype,
}: ActionPanelProps) {
  const [selectedCondition, setSelectedCondition] = useState<SrdCondition>('blinded');

  const suggested = suggestArchetype(combatant);

  const reactionAvailable =
    combatant.reactions.length > 0 && combatant.reactions[0].available;

  const allResources = [...combatant.actions, ...combatant.bonus_actions];

  function renderActionList(actions: CombatantAction[]) {
    return (
      <div className="flex flex-col gap-2">
        {actions.map(action => {
          const rec = recommendedActions.find(r => r.action.id === action.id);
          return (
            <ActionCard
              key={action.id}
              action={action}
              isRecommended={!!rec}
              recommendationReason={rec?.reason}
              confidence={rec?.confidence}
              onClick={onActionClick && action.available ? () => onActionClick(action) : undefined}
            />
          );
        })}
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
          {!onSetArchetype && <ArchetypeBadge archetype={combatant.archetype} size="sm" />}
        </div>
        <p className="text-sm text-stone-400 mt-0.5">Round {currentRound}</p>
        {onSetArchetype && (
          <div className="mt-2 max-w-xs">
            <ArchetypeSelector
              value={combatant.archetype}
              onChange={onSetArchetype}
              suggestedArchetype={suggested}
            />
          </div>
        )}
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
