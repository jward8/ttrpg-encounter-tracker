import { useState } from 'react';
import { useCampaignStore } from '../../store/campaignStore';
import { useEncounterStore } from '../../store/encounterStore';
import { useUiStore } from '../../store/uiStore';
import type { Combatant, PlayerCharacter } from '../../fileSystem/schema';
import CombatantForm from './CombatantForm';

function playerCharacterToCombatant(pc: PlayerCharacter): Combatant {
  return {
    id: pc.id,
    name: pc.name,
    type: 'player_character',
    ac: pc.ac,
    max_hp: pc.max_hp,
    current_hp: pc.current_hp,
    temp_hp: pc.temp_hp,
    speed: pc.speed,
    initiative: null,
    initiative_modifier: pc.initiative_modifier,
    conditions: [],
    actions: pc.actions,
    bonus_actions: pc.bonus_actions,
    reactions: pc.reactions,
    spell_slots: pc.spell_slots,
    resistances: pc.resistances,
    immunities: pc.immunities,
    vulnerabilities: pc.vulnerabilities,
    legendary_actions_max: 0,
    legendary_actions_remaining: 0,
    archetype: null,
    notes: pc.notes,
  };
}

export default function EncounterSetup() {
  const campaign = useCampaignStore(s => s.campaign);
  const encounter = useEncounterStore(s => s.encounter);
  const updateEncounterMeta = useEncounterStore(s => s.updateEncounterMeta);
  const addCombatant = useEncounterStore(s => s.addCombatant);
  const removeCombatant = useEncounterStore(s => s.removeCombatant);
  const setEncounterStatus = useEncounterStore(s => s.setEncounterStatus);
  const goToHub = useUiStore(s => s.goToHub);

  const [selectedPcIds, setSelectedPcIds] = useState<Set<string>>(() => {
    const ids = encounter.combatants
      .filter(c => c.type === 'player_character')
      .map(c => c.id);
    return new Set(ids);
  });
  const [showNpcForm, setShowNpcForm] = useState(false);

  const campaignId = campaign?.id ?? '';

  function handleNameChange(name: string) {
    updateEncounterMeta(name, campaignId, encounter.tactics_enabled);
  }

  function handleTacticsToggle() {
    updateEncounterMeta(encounter.name, campaignId, !encounter.tactics_enabled);
  }

  function handleTogglePc(pcId: string) {
    setSelectedPcIds(prev => {
      const next = new Set(prev);
      if (next.has(pcId)) next.delete(pcId);
      else next.add(pcId);
      return next;
    });
  }

  function handleSelectAll() {
    setSelectedPcIds(prev => {
      const next = new Set(prev);
      for (const pc of campaign?.player_characters ?? []) next.add(pc.id);
      return next;
    });
  }

  function handleDeselectAll() {
    setSelectedPcIds(() => {
      const next = new Set<string>();
      // Keep already-added combatants checked (they're disabled)
      for (const c of encounter.combatants) {
        if (c.type === 'player_character') next.add(c.id);
      }
      return next;
    });
  }

  function handleRemoveCombatant(id: string) {
    const c = encounter.combatants.find(x => x.id === id);
    removeCombatant(id);
    if (c?.type === 'player_character') {
      setSelectedPcIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  function handleProceed() {
    for (const pcId of selectedPcIds) {
      if (encounter.combatants.some(c => c.id === pcId)) continue;
      const pc = campaign?.player_characters.find(p => p.id === pcId);
      if (pc) addCombatant(playerCharacterToCombatant(pc));
    }
    setEncounterStatus('initiative');
  }

  const alreadyAdded = new Set(encounter.combatants.map(c => c.id));
  const canProceed = encounter.combatants.length > 0 || selectedPcIds.size > 0;

  const typeBadge = (type: string) => {
    if (type === 'player_character') return 'text-emerald-300';
    if (type === 'allied_npc') return 'text-blue-300';
    return 'text-red-300';
  };

  const typeLabel = (type: string) => {
    if (type === 'player_character') return 'PC';
    if (type === 'allied_npc') return 'Ally';
    return 'Enemy';
  };

  const inputCls = 'bg-stone-800 border border-stone-600 rounded px-2 py-1 text-sm text-stone-100 focus:outline-none focus:border-amber-500';

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-3xl mx-auto w-full space-y-6">
      <div>
        <button
          onClick={goToHub}
          className="text-xs text-stone-400 hover:text-stone-200"
        >
          ← Back to Campaign
        </button>
      </div>
      {/* A — Meta */}
      <section className="bg-stone-900 border border-stone-700 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-stone-500">Campaign:</span>
          <span className="text-xs text-stone-300">{campaign?.name ?? '—'}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="text-xs text-stone-400 mb-1 block">Encounter Name</label>
            <input
              className={`${inputCls} w-full`}
              value={encounter.name}
              onChange={e => handleNameChange(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-stone-300 cursor-pointer mt-4">
            <input
              type="checkbox"
              checked={encounter.tactics_enabled}
              onChange={handleTacticsToggle}
              className="accent-amber-500"
            />
            Tactics
          </label>
        </div>
      </section>

      {/* B — PC Roster */}
      {(campaign?.player_characters.length ?? 0) > 0 && (
        <section className="bg-stone-900 border border-stone-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-stone-200">PC Roster</h3>
            <div className="flex gap-2">
              <button
                onClick={handleSelectAll}
                className="text-xs text-stone-400 hover:text-stone-200"
              >
                Select All
              </button>
              <span className="text-stone-600">·</span>
              <button
                onClick={handleDeselectAll}
                className="text-xs text-stone-400 hover:text-stone-200"
              >
                Deselect All
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {campaign!.player_characters.map(pc => {
              const disabled = alreadyAdded.has(pc.id);
              const checked = selectedPcIds.has(pc.id);
              const classLabel = pc.classes.length > 0
                ? `${pc.classes.join('/')} ${pc.level}`
                : `Level ${pc.level}`;
              return (
                <label
                  key={pc.id}
                  className={`flex items-center gap-3 px-3 py-2 rounded border transition-colors cursor-pointer ${
                    disabled
                      ? 'border-stone-700 opacity-60 cursor-not-allowed'
                      : 'border-stone-700 hover:border-stone-500'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => handleTogglePc(pc.id)}
                    className="accent-amber-500"
                  />
                  <span className="flex-1 text-sm text-stone-100">{pc.name}</span>
                  <span className="text-xs text-stone-400">{classLabel}</span>
                  <span className="text-xs text-stone-500">AC {pc.ac}</span>
                  <span className="text-xs text-stone-500">{pc.max_hp} HP</span>
                </label>
              );
            })}
          </div>
        </section>
      )}

      {/* C — NPCs + Review */}
      <section className="bg-stone-900 border border-stone-700 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-stone-200">Combatants</h3>
          {!showNpcForm && (
            <button
              onClick={() => setShowNpcForm(true)}
              className="text-xs text-amber-400 hover:text-amber-300"
            >
              + Add NPC
            </button>
          )}
        </div>

        {showNpcForm && (
          <CombatantForm
            onSubmit={combatant => {
              addCombatant(combatant);
              setShowNpcForm(false);
            }}
            onCancel={() => setShowNpcForm(false)}
          />
        )}

        {encounter.combatants.length === 0 ? (
          <p className="text-xs text-stone-600 italic">No combatants yet.</p>
        ) : (
          <div className="space-y-1">
            {encounter.combatants.map(c => (
              <div
                key={c.id}
                className="flex items-center gap-3 px-3 py-2 rounded border border-stone-700"
              >
                <span className={`text-xs font-semibold ${typeBadge(c.type)}`}>
                  {typeLabel(c.type)}
                </span>
                <span className="flex-1 text-sm text-stone-100">{c.name}</span>
                <span className="text-xs text-stone-500">AC {c.ac}</span>
                <span className="text-xs text-stone-500">{c.max_hp} HP</span>
                <button
                  onClick={() => handleRemoveCombatant(c.id)}
                  className="text-stone-500 hover:text-red-400 text-sm ml-1"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Proceed */}
      <div className="flex justify-end pb-6">
        <button
          onClick={handleProceed}
          disabled={!canProceed}
          className="px-5 py-2 rounded bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Proceed to Initiative →
        </button>
      </div>
    </div>
  );
}
