import { describe, it, expect } from 'vitest';
import { applyDamage } from './damageEngine';
import { Combatant } from '../fileSystem/schema';

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

describe('applyDamage', () => {
  it('immunity: returns zero damage and unchanged HP', () => {
    const c = makeCombatant({ immunities: ['fire'], current_hp: 20 });
    const result = applyDamage(c, 50, 'fire');
    expect(result.finalAmount).toBe(0);
    expect(result.newHp).toBe(20);
    expect(result.newTempHp).toBe(0);
    expect(result.note).toBe('Immune');
  });

  it('resistance: halves damage (floor)', () => {
    const c = makeCombatant({ resistances: ['fire'], current_hp: 30 });
    const result = applyDamage(c, 10, 'fire');
    expect(result.newHp).toBe(25);
    expect(result.note).toContain('half');
  });

  it('resistance: floors the halved amount', () => {
    const c = makeCombatant({ resistances: ['fire'], current_hp: 30 });
    const result = applyDamage(c, 7, 'fire');
    expect(result.newHp).toBe(27);
  });

  it('vulnerability: doubles damage', () => {
    const c = makeCombatant({ vulnerabilities: ['fire'], current_hp: 30 });
    const result = applyDamage(c, 10, 'fire');
    expect(result.newHp).toBe(10);
    expect(result.note).toContain('double');
  });

  it('temp HP absorbs damage fully when temp HP >= damage', () => {
    const c = makeCombatant({ current_hp: 20, temp_hp: 10 });
    const result = applyDamage(c, 5, 'fire');
    expect(result.newTempHp).toBe(5);
    expect(result.newHp).toBe(20);
  });

  it('temp HP absorbs damage partially when temp HP < damage', () => {
    const c = makeCombatant({ current_hp: 20, temp_hp: 10 });
    const result = applyDamage(c, 15, 'fire');
    expect(result.newTempHp).toBe(0);
    expect(result.newHp).toBe(15);
  });

  it('HP floors at 0 for massive damage', () => {
    const c = makeCombatant({ current_hp: 1 });
    const result = applyDamage(c, 999, 'slashing');
    expect(result.newHp).toBe(0);
  });

  it('normal damage with no modifiers', () => {
    const c = makeCombatant({ current_hp: 30 });
    const result = applyDamage(c, 8, 'slashing');
    expect(result.newHp).toBe(22);
    expect(result.note).toBe('');
  });
});
