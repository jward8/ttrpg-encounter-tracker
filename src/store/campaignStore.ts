import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Campaign, PlayerCharacter } from '../fileSystem/schema';
import {
  saveCampaign as saveCampaignIO,
  loadCampaign as loadCampaignIO,
} from '../fileSystem/campaignIO';

interface CampaignStore {
  campaign: Campaign | null;
  createCampaign: (name: string) => void;
  loadFromRoot: (rootPath: string) => Promise<void>;
  addPlayerCharacter: (pc: PlayerCharacter) => void;
  updatePlayerCharacter: (id: string, updates: Partial<PlayerCharacter>) => void;
  removePlayerCharacter: (id: string) => void;
  saveCampaign: (rootPath: string) => Promise<void>;
}

export const useCampaignStore = create<CampaignStore>()(
  subscribeWithSelector((set, get) => ({
    campaign: null,

    createCampaign: (name: string) => {
      const now = new Date().toISOString();
      set({
        campaign: {
          id: crypto.randomUUID(),
          name,
          player_characters: [],
          created_at: now,
          updated_at: now,
        },
      });
    },

    loadFromRoot: async (rootPath: string) => {
      const entries = await window.electronAPI.listFiles(rootPath);
      for (const name of entries) {
        const campaign = await loadCampaignIO(rootPath, name);
        if (campaign) {
          set({ campaign });
          return;
        }
      }
    },

    addPlayerCharacter: (pc: PlayerCharacter) => {
      const { campaign } = get();
      if (!campaign) return;
      set({
        campaign: {
          ...campaign,
          player_characters: [...campaign.player_characters, pc],
          updated_at: new Date().toISOString(),
        },
      });
    },

    updatePlayerCharacter: (id: string, updates: Partial<PlayerCharacter>) => {
      const { campaign } = get();
      if (!campaign) return;
      set({
        campaign: {
          ...campaign,
          player_characters: campaign.player_characters.map(pc =>
            pc.id === id ? { ...pc, ...updates } : pc,
          ),
          updated_at: new Date().toISOString(),
        },
      });
    },

    removePlayerCharacter: (id: string) => {
      const { campaign } = get();
      if (!campaign) return;
      set({
        campaign: {
          ...campaign,
          player_characters: campaign.player_characters.filter(pc => pc.id !== id),
          updated_at: new Date().toISOString(),
        },
      });
    },

    saveCampaign: async (rootPath: string) => {
      const { campaign } = get();
      if (!campaign) return;
      await saveCampaignIO(campaign, rootPath);
    },
  })),
);
