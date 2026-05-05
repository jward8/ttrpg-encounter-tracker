import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Campaign, PlayerCharacter } from '../fileSystem/schema';
import { saveCampaign as saveCampaignIO } from '../fileSystem/campaignIO';

interface CampaignStore {
  campaign: Campaign | null;
  createCampaign: (name: string) => void;
  loadCampaignFromDir: (dirHandle: FileSystemDirectoryHandle) => Promise<void>;
  addPlayerCharacter: (pc: PlayerCharacter) => void;
  updatePlayerCharacter: (id: string, updates: Partial<PlayerCharacter>) => void;
  removePlayerCharacter: (id: string) => void;
  saveCampaign: (dirHandle: FileSystemDirectoryHandle) => Promise<void>;
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

    loadCampaignFromDir: async (dirHandle: FileSystemDirectoryHandle) => {
      for await (const entry of dirHandle.values()) {
        if (entry.kind !== 'directory') continue;
        try {
          const subDir = entry as FileSystemDirectoryHandle;
          const fileHandle = await subDir.getFileHandle('campaign.json');
          const file = await fileHandle.getFile();
          const text = await file.text();
          const campaign = JSON.parse(text) as Campaign;
          set({ campaign });
          return;
        } catch {
          // Not a campaign directory
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

    saveCampaign: async (dirHandle: FileSystemDirectoryHandle) => {
      const { campaign } = get();
      if (!campaign) return;
      await saveCampaignIO(campaign, dirHandle);
    },
  })),
);
