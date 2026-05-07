import { describe, it, expect, beforeEach } from 'vitest';
import { useEncounterStore } from './encounterStore';
import { useCampaignStore } from './campaignStore';
import type { Combatant, PlayerCharacter, Encounter } from '../fileSystem/schema';

function makePc(overrides: Partial<PlayerCharacter> = {}): PlayerCharacter {
  return {
    id: 'pc-1',
    name: 'Lyra',
    player_name: '',
    classes: ['Wizard'],
    level: 5,
    ac: 12,
    max_hp: 28,
    initiative_modifier: 2,
    speed: 30,
    spell_slots: { 1: { max: 4, remaining: 4 }, 3: { max: 2, remaining: 2 } },
    actions: [],
    bonus_actions: [],
    reactions: [],
    notes: '',
    current_hp: 28,
    temp_hp: 0,
    ability_scores: {
      strength: 10, dexterity: 14, constitution: 12,
      intelligence: 16, wisdom: 13, charisma: 10,
    },
    save_proficiencies: ['intelligence', 'wisdom'],
    proficiency_bonus: 3,
    passive_perception: 11,
    resistances: [],
    immunities: [],
    vulnerabilities: [],
    imported_from: 'manual',
    ...overrides,
  };
}

function combatantFromPc(pc: PlayerCharacter, overrides: Partial<Combatant> = {}): Combatant {
  return {
    id: pc.id,
    name: pc.name,
    type: 'player_character',
    ac: pc.ac,
    max_hp: pc.max_hp,
    current_hp: pc.current_hp,
    temp_hp: pc.temp_hp,
    speed: pc.speed,
    initiative: 10,
    initiative_modifier: pc.initiative_modifier,
    conditions: [],
    actions: pc.actions,
    bonus_actions: pc.bonus_actions,
    reactions: pc.reactions,
    spell_slots: structuredClone(pc.spell_slots),
    resistances: pc.resistances,
    immunities: pc.immunities,
    vulnerabilities: pc.vulnerabilities,
    legendary_actions_max: 0,
    legendary_actions_remaining: 0,
    archetype: null,
    notes: pc.notes,
    ...overrides,
  };
}

function makeEncounter(combatants: Combatant[]): Encounter {
  return {
    id: 'enc-1',
    campaign_id: 'camp-1',
    name: 'Test Encounter',
    status: 'active',
    tactics_enabled: false,
    current_round: 1,
    current_turn_index: 0,
    combatants,
    combat_log: [],
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
}

describe('encounterStore write-back', () => {
  beforeEach(() => {
    useCampaignStore.setState({ campaign: null });
    useEncounterStore.setState({
      encounter: makeEncounter([]),
      past: [],
      rootPath: null,
      recommendedActions: [],
    });
  });

  it('writes back current_hp when PC took damage', () => {
    const pc = makePc({ current_hp: 28 });
    useCampaignStore.getState().createCampaign('Test');
    useCampaignStore.getState().addPlayerCharacter(pc);
    const wounded = combatantFromPc(pc, { current_hp: 12, temp_hp: 0 });
    useEncounterStore.setState({ encounter: makeEncounter([wounded]) });

    useEncounterStore.getState().setEncounterStatus('done');

    const after = useCampaignStore.getState().campaign!.player_characters[0];
    expect(after.current_hp).toBe(12);
    expect(after.temp_hp).toBe(0);
  });

  it('writes back spell slot remaining', () => {
    const pc = makePc();
    useCampaignStore.getState().createCampaign('Test');
    useCampaignStore.getState().addPlayerCharacter(pc);
    const c = combatantFromPc(pc);
    c.spell_slots[1] = { max: 4, remaining: 1 };
    c.spell_slots[3] = { max: 2, remaining: 0 };
    useEncounterStore.setState({ encounter: makeEncounter([c]) });

    useEncounterStore.getState().setEncounterStatus('done');

    const after = useCampaignStore.getState().campaign!.player_characters[0];
    expect(after.spell_slots[1].remaining).toBe(1);
    expect(after.spell_slots[3].remaining).toBe(0);
  });

  it('writes back action uses_remaining when uses_max is set', () => {
    const pc = makePc({
      actions: [{
        id: 'act-1',
        name: 'Action Surge',
        action_category: 'action',
        range_hint: 'self',
        uses_max: 1,
        uses_remaining: 1,
        available: true,
      }],
    });
    useCampaignStore.getState().createCampaign('Test');
    useCampaignStore.getState().addPlayerCharacter(pc);
    const c = combatantFromPc(pc);
    c.actions = [{
      ...pc.actions[0],
      uses_remaining: 0,
      available: false,
    }];
    useEncounterStore.setState({ encounter: makeEncounter([c]) });

    useEncounterStore.getState().setEncounterStatus('done');

    const after = useCampaignStore.getState().campaign!.player_characters[0];
    expect(after.actions[0].uses_remaining).toBe(0);
  });

  it('skips combatants with no matching PC in the roster', () => {
    useCampaignStore.getState().createCampaign('Test');
    // No PCs in roster.
    const guest = combatantFromPc(makePc({ id: 'guest-pc' }), { current_hp: 5 });
    useEncounterStore.setState({ encounter: makeEncounter([guest]) });

    expect(() =>
      useEncounterStore.getState().setEncounterStatus('done'),
    ).not.toThrow();
    expect(useCampaignStore.getState().campaign!.player_characters).toEqual([]);
  });

  it('is idempotent across repeated transitions to "done"', () => {
    const pc = makePc({ current_hp: 28 });
    useCampaignStore.getState().createCampaign('Test');
    useCampaignStore.getState().addPlayerCharacter(pc);
    const c = combatantFromPc(pc, { current_hp: 12 });
    useEncounterStore.setState({ encounter: makeEncounter([c]) });

    useEncounterStore.getState().setEncounterStatus('done');
    // Manually heal the PC mid-flight via campaign store.
    useCampaignStore.getState().updatePlayerCharacter(pc.id, { current_hp: 28 });
    // Flip status away and back — should not re-trigger write-back from stale combatant.
    useEncounterStore.setState(s => ({ encounter: { ...s.encounter, status: 'done' } }));
    useEncounterStore.getState().setEncounterStatus('done');

    const after = useCampaignStore.getState().campaign!.player_characters[0];
    expect(after.current_hp).toBe(28);
  });

  it('skips non-PC combatants', () => {
    const pc = makePc();
    useCampaignStore.getState().createCampaign('Test');
    useCampaignStore.getState().addPlayerCharacter(pc);
    const enemy: Combatant = combatantFromPc(pc, { id: 'enemy-1', type: 'enemy_npc', current_hp: 0 });
    useEncounterStore.setState({ encounter: makeEncounter([enemy]) });

    useEncounterStore.getState().setEncounterStatus('done');

    const after = useCampaignStore.getState().campaign!.player_characters[0];
    expect(after.current_hp).toBe(28); // unchanged
  });
});
