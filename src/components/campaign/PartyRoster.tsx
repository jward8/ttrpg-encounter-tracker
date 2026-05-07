import { useState } from 'react';
import { useCampaignStore } from '../../store/campaignStore';
import type { PlayerCharacter } from '../../fileSystem/schema';
import PartyRosterRow from './PartyRosterRow';
import PlayerCharacterForm from './PlayerCharacterForm';

type FormMode =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; pc: PlayerCharacter };

function fullSpellSlots(slots: PlayerCharacter['spell_slots']): PlayerCharacter['spell_slots'] {
  const out: PlayerCharacter['spell_slots'] = {};
  for (const k of Object.keys(slots)) {
    const level = Number(k);
    out[level] = { max: slots[level].max, remaining: slots[level].max };
  }
  return out;
}

function actionsAtFullUses(actions: PlayerCharacter['actions']): PlayerCharacter['actions'] {
  return actions.map(a => ({
    ...a,
    uses_remaining: a.uses_max,
    available: true,
  }));
}

export default function PartyRoster() {
  const campaign = useCampaignStore(s => s.campaign);
  const addPlayerCharacter = useCampaignStore(s => s.addPlayerCharacter);
  const updatePlayerCharacter = useCampaignStore(s => s.updatePlayerCharacter);
  const removePlayerCharacter = useCampaignStore(s => s.removePlayerCharacter);

  const [mode, setMode] = useState<FormMode>({ kind: 'closed' });

  if (!campaign) return null;

  function handleSubmit(pc: PlayerCharacter) {
    if (mode.kind === 'edit') {
      updatePlayerCharacter(pc.id, pc);
    } else {
      addPlayerCharacter(pc);
    }
    setMode({ kind: 'closed' });
  }

  function handleRemove(pc: PlayerCharacter) {
    if (confirm(`Remove "${pc.name}" from the party?`)) {
      removePlayerCharacter(pc.id);
    }
  }

  function handleResetHp(pc: PlayerCharacter) {
    updatePlayerCharacter(pc.id, {
      current_hp: pc.max_hp,
      temp_hp: 0,
      spell_slots: fullSpellSlots(pc.spell_slots),
      actions: actionsAtFullUses(pc.actions),
      bonus_actions: actionsAtFullUses(pc.bonus_actions),
      reactions: actionsAtFullUses(pc.reactions),
    });
  }

  return (
    <section className="bg-stone-900 border border-stone-700 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-stone-200">Party</h3>
        {mode.kind === 'closed' && (
          <div className="flex gap-3">
            <button
              onClick={() => setMode({ kind: 'create' })}
              className="text-xs text-amber-400 hover:text-amber-300"
            >
              + Add Manually
            </button>
            <button
              disabled
              title="Phase 2 — coming soon"
              className="text-xs text-stone-600 cursor-not-allowed"
            >
              + Import PDF
            </button>
          </div>
        )}
      </div>

      {mode.kind !== 'closed' && (
        <PlayerCharacterForm
          initial={mode.kind === 'edit' ? mode.pc : null}
          onSubmit={handleSubmit}
          onCancel={() => setMode({ kind: 'closed' })}
        />
      )}

      {campaign.player_characters.length === 0 ? (
        <p className="text-xs text-stone-600 italic">No party members yet.</p>
      ) : (
        <div className="space-y-2">
          {campaign.player_characters.map(pc => (
            <PartyRosterRow
              key={pc.id}
              pc={pc}
              onEdit={() => setMode({ kind: 'edit', pc })}
              onRemove={() => handleRemove(pc)}
              onResetHp={() => handleResetHp(pc)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
