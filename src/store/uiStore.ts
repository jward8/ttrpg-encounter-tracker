import { create } from 'zustand';

export type View = 'hub' | 'encounter';

interface UiStore {
  view: View;
  goToHub: () => void;
  goToEncounter: () => void;
}

export const useUiStore = create<UiStore>(set => ({
  view: 'hub',
  goToHub: () => set({ view: 'hub' }),
  goToEncounter: () => set({ view: 'encounter' }),
}));
