import { describe, it, expect } from 'vitest';
import { getRecommendedActions } from './tacticEngine';
import { Combatant, CombatantAction } from '../fileSystem/schema';

function makeAction(overrides: Partial<CombatantAction>): CombatantAction {
  return {
    id: 'a1',
    name: 'Strike',
    action_category: 'action',
    range_hint: 'melee',
    available: true,
    ...overrides,
  };
}

function makeCombatant(overrides: Partial<Combatant> = {}): Combatant {
  return {
    id: 'c1',
    name: 'Test',
    type: 'enemy_npc',
    ac: 12,
    max_hp: 30,
    current_hp: 30,
    temp_hp: 0,
    speed: 30,
    initiative: null,
    initiative_modifier: 0,
    conditions: [],
    actions: [],
    bonus_actions: [],
    reactions: [],
    spell_slots: {},
    resistances: [],
    immunities: [],
    vulnerabilities: [],
    legendary_actions_max: 0,
    legendary_actions_remaining: 0,
    archetype: null,
    notes: '',
    ...overrides,
  };
}

describe('getRecommendedActions', () => {
  it('returns empty array when no archetype is assigned', () => {
    const c = makeCombatant({
      archetype: null,
      actions: [makeAction({ range_hint: 'melee' })],
    });
    expect(getRecommendedActions(c, [])).toEqual([]);
  });

  it('brute: recommends melee actions', () => {
    const melee = makeAction({ id: 'a1', range_hint: 'melee' });
    const c = makeCombatant({ archetype: 'brute', actions: [melee] });
    const results = getRecommendedActions(c, []);
    expect(results.map(r => r.action.id)).toContain('a1');
  });

  it('glass_cannon: recommends ranged actions', () => {
    const ranged = makeAction({ id: 'a2', range_hint: 'ranged_60', damage: '2d6' });
    const c = makeCombatant({ archetype: 'glass_cannon', actions: [ranged] });
    const results = getRecommendedActions(c, []);
    expect(results.map(r => r.action.id)).toContain('a2');
  });

  it('controller: recommends area actions', () => {
    const aoe = makeAction({ id: 'a3', range_hint: 'area' });
    const c = makeCombatant({ archetype: 'controller', actions: [aoe] });
    const results = getRecommendedActions(c, []);
    expect(results.map(r => r.action.id)).toContain('a3');
  });

  it('unavailable actions are never recommended', () => {
    const spent = makeAction({ id: 'a4', range_hint: 'melee', available: false });
    const c = makeCombatant({ archetype: 'brute', actions: [spent] });
    const results = getRecommendedActions(c, []);
    expect(results).toHaveLength(0);
  });

  it('includes bonus actions in recommendations', () => {
    const bonus = makeAction({ id: 'ba1', range_hint: 'melee', action_category: 'bonus_action' });
    const c = makeCombatant({ archetype: 'brute', bonus_actions: [bonus] });
    const results = getRecommendedActions(c, []);
    expect(results.map(r => r.action.id)).toContain('ba1');
  });
});
