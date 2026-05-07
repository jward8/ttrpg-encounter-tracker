import { describe, it, expect, beforeEach } from 'vitest';
import { useCampaignStore } from './campaignStore';
import type { PlayerCharacter } from '../fileSystem/schema';

function makePc(overrides: Partial<PlayerCharacter> = {}): PlayerCharacter {
  return {
    id: 'pc-test',
    name: 'Test PC',
    player_name: '',
    classes: [],
    level: 1,
    ac: 10,
    max_hp: 10,
    initiative_modifier: 0,
    speed: 30,
    spell_slots: {},
    actions: [],
    bonus_actions: [],
    reactions: [],
    notes: '',
    current_hp: 10,
    temp_hp: 0,
    ability_scores: {
      strength: 10, dexterity: 10, constitution: 10,
      intelligence: 10, wisdom: 10, charisma: 10,
    },
    save_proficiencies: [],
    proficiency_bonus: 2,
    passive_perception: 10,
    resistances: [],
    immunities: [],
    vulnerabilities: [],
    imported_from: 'manual',
    ...overrides,
  };
}

describe('campaignStore', () => {
  beforeEach(() => {
    useCampaignStore.setState({ campaign: null });
  });

  describe('createCampaign', () => {
    it('creates a campaign with empty roster', () => {
      useCampaignStore.getState().createCampaign('Curse of Strahd');
      const c = useCampaignStore.getState().campaign!;
      expect(c.name).toBe('Curse of Strahd');
      expect(c.player_characters).toEqual([]);
      expect(c.id).toBeTruthy();
      expect(c.created_at).toBe(c.updated_at);
    });
  });

  describe('addPlayerCharacter', () => {
    it('appends to the roster and bumps updated_at', async () => {
      useCampaignStore.getState().createCampaign('C1');
      const before = useCampaignStore.getState().campaign!.updated_at;
      // Force a measurable timestamp delta.
      await new Promise(r => setTimeout(r, 5));
      useCampaignStore.getState().addPlayerCharacter(makePc({ id: 'a' }));
      const after = useCampaignStore.getState().campaign!;
      expect(after.player_characters.map(p => p.id)).toEqual(['a']);
      expect(after.updated_at >= before).toBe(true);
    });

    it('no-ops when no campaign loaded', () => {
      useCampaignStore.getState().addPlayerCharacter(makePc());
      expect(useCampaignStore.getState().campaign).toBeNull();
    });
  });

  describe('updatePlayerCharacter', () => {
    it('applies partial update to the matching PC', () => {
      useCampaignStore.getState().createCampaign('C1');
      useCampaignStore.getState().addPlayerCharacter(makePc({ id: 'a', current_hp: 20 }));
      useCampaignStore.getState().updatePlayerCharacter('a', { current_hp: 5 });
      const pc = useCampaignStore.getState().campaign!.player_characters[0];
      expect(pc.current_hp).toBe(5);
      expect(pc.id).toBe('a');
    });

    it('leaves other PCs untouched', () => {
      useCampaignStore.getState().createCampaign('C1');
      useCampaignStore.getState().addPlayerCharacter(makePc({ id: 'a', current_hp: 20 }));
      useCampaignStore.getState().addPlayerCharacter(makePc({ id: 'b', current_hp: 30 }));
      useCampaignStore.getState().updatePlayerCharacter('a', { current_hp: 5 });
      const pcs = useCampaignStore.getState().campaign!.player_characters;
      expect(pcs.find(p => p.id === 'a')!.current_hp).toBe(5);
      expect(pcs.find(p => p.id === 'b')!.current_hp).toBe(30);
    });

    it('no-ops when no campaign loaded', () => {
      useCampaignStore.getState().updatePlayerCharacter('a', { current_hp: 5 });
      expect(useCampaignStore.getState().campaign).toBeNull();
    });
  });

  describe('removePlayerCharacter', () => {
    it('removes the matching PC', () => {
      useCampaignStore.getState().createCampaign('C1');
      useCampaignStore.getState().addPlayerCharacter(makePc({ id: 'a' }));
      useCampaignStore.getState().addPlayerCharacter(makePc({ id: 'b' }));
      useCampaignStore.getState().removePlayerCharacter('a');
      const pcs = useCampaignStore.getState().campaign!.player_characters;
      expect(pcs.map(p => p.id)).toEqual(['b']);
    });

    it('no-ops when no campaign loaded', () => {
      useCampaignStore.getState().removePlayerCharacter('a');
      expect(useCampaignStore.getState().campaign).toBeNull();
    });
  });
});
