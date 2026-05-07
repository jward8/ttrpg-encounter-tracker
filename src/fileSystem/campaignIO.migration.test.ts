import { describe, it, expect } from 'vitest';
import { migratePlayerCharacter } from './campaignIO';

describe('migratePlayerCharacter', () => {
  const legacy = {
    id: 'pc-1',
    name: 'Lyra',
    player_name: 'Alice',
    classes: ['Wizard'],
    level: 5,
    ac: 12,
    max_hp: 28,
    initiative_modifier: 2,
    speed: 30,
    spell_slots: {},
    actions: [],
    bonus_actions: [],
    reactions: [],
    notes: '',
  };

  it('fills current_hp from max_hp when missing', () => {
    expect(migratePlayerCharacter(legacy).current_hp).toBe(28);
  });

  it('defaults temp_hp to 0', () => {
    expect(migratePlayerCharacter(legacy).temp_hp).toBe(0);
  });

  it('defaults all ability scores to 10', () => {
    expect(migratePlayerCharacter(legacy).ability_scores).toEqual({
      strength: 10, dexterity: 10, constitution: 10,
      intelligence: 10, wisdom: 10, charisma: 10,
    });
  });

  it('defaults save_proficiencies to empty list', () => {
    expect(migratePlayerCharacter(legacy).save_proficiencies).toEqual([]);
  });

  it('derives proficiency_bonus from level (5e formula)', () => {
    expect(migratePlayerCharacter({ ...legacy, level: 1 }).proficiency_bonus).toBe(2);
    expect(migratePlayerCharacter({ ...legacy, level: 4 }).proficiency_bonus).toBe(2);
    expect(migratePlayerCharacter({ ...legacy, level: 5 }).proficiency_bonus).toBe(3);
    expect(migratePlayerCharacter({ ...legacy, level: 17 }).proficiency_bonus).toBe(6);
  });

  it('defaults passive_perception to 10', () => {
    expect(migratePlayerCharacter(legacy).passive_perception).toBe(10);
  });

  it('defaults damage trait arrays to empty', () => {
    const m = migratePlayerCharacter(legacy);
    expect(m.resistances).toEqual([]);
    expect(m.immunities).toEqual([]);
    expect(m.vulnerabilities).toEqual([]);
  });

  it('defaults imported_from to "manual"', () => {
    expect(migratePlayerCharacter(legacy).imported_from).toBe('manual');
  });

  it('preserves existing values when fields are already present', () => {
    const already = {
      ...legacy,
      current_hp: 15,
      temp_hp: 5,
      ability_scores: {
        strength: 16, dexterity: 14, constitution: 13,
        intelligence: 12, wisdom: 10, charisma: 8,
      },
      save_proficiencies: ['constitution', 'intelligence'],
      proficiency_bonus: 3,
      passive_perception: 13,
      resistances: ['fire'],
      immunities: [],
      vulnerabilities: ['cold'],
      imported_from: 'dndbeyond',
    };
    const m = migratePlayerCharacter(already);
    expect(m.current_hp).toBe(15);
    expect(m.temp_hp).toBe(5);
    expect(m.ability_scores.strength).toBe(16);
    expect(m.save_proficiencies).toEqual(['constitution', 'intelligence']);
    expect(m.proficiency_bonus).toBe(3);
    expect(m.passive_perception).toBe(13);
    expect(m.resistances).toEqual(['fire']);
    expect(m.imported_from).toBe('dndbeyond');
  });
});
