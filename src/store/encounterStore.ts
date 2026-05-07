import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  Encounter, Combatant, DamageType, ConditionInstance,
  CombatLogEntry, EncounterStatus, CombatantAction, Archetype,
  PlayerCharacter,
} from '../fileSystem/schema';
import { applyDamage as damageEngineApply } from '../engine/damageEngine';
import { getRecommendedActions, type RecommendedAction } from '../engine/tacticEngine';
import { loadLatestEncounter } from '../fileSystem/encounterIO';
import { useCampaignStore } from './campaignStore';
import { useToastStore } from './toastStore';

const MAX_UNDO = 20;
const ROOT_PATH_KEY = 'ttrpg-root-path';

const INITIAL_ENCOUNTER: Encounter = {
  id: crypto.randomUUID(),
  campaign_id: '',
  name: 'New Encounter',
  status: 'setup',
  tactics_enabled: false,
  current_round: 1,
  current_turn_index: 0,
  combatants: [],
  combat_log: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export interface CommitActionPayload {
  actorId: string;
  actionId: string;
  entry: CombatLogEntry;
  damageTargets?: Array<{ id: string; amount: number; damageType: DamageType }>;
  conditionTargets?: Array<{ id: string; condition: string; source?: string }>;
  consumeSpellSlotLevel?: number;
}

interface EncounterStore {
  encounter: Encounter;
  past: Encounter[];
  rootPath: string | null;
  recommendedActions: RecommendedAction[];

  openDirectory: () => Promise<void>;
  loadEncounterFromFile: (file: File) => Promise<void>;

  createNewEncounter: (name: string, campaignId: string, tacticsEnabled: boolean) => void;
  updateEncounterMeta: (name: string, campaignId: string, tacticsEnabled: boolean) => void;
  addCombatant: (combatant: Combatant) => void;
  removeCombatant: (id: string) => void;
  setCombatantArchetype: (id: string, archetype: Archetype) => void;
  setAllInitiatives: (values: Record<string, number>) => void;
  startCombat: () => void;

  advanceTurn: () => void;
  setEncounterStatus: (status: EncounterStatus) => void;

  applyDamage: (combatantId: string, amount: number, damageType: DamageType) => void;
  healCombatant: (combatantId: string, amount: number) => void;
  setTempHp: (combatantId: string, amount: number) => void;

  applyCondition: (combatantId: string, condition: string, source?: string) => void;
  removeCondition: (combatantId: string, index: number) => void;

  useAction: (combatantId: string, actionId: string) => void;
  useReaction: (combatantId: string) => void;
  consumeSpellSlot: (combatantId: string, level: number) => void;
  markActionAvailable: (combatantId: string, actionId: string) => void;

  commitAction: (payload: CommitActionPayload) => void;
  logAction: (entry: CombatLogEntry) => void;
  undoLastAction: () => void;
}

function writeBackToRoster(encounter: Encounter) {
  const campaign = useCampaignStore.getState().campaign;
  if (!campaign) return;
  const update = useCampaignStore.getState().updatePlayerCharacter;

  const summary = { damaged: 0, slotsSpent: 0, usesSpent: 0 };

  for (const c of encounter.combatants) {
    if (c.type !== 'player_character') continue;
    const pc = campaign.player_characters.find(p => p.id === c.id);
    if (!pc) continue;

    const patch: Partial<PlayerCharacter> = {
      current_hp: c.current_hp,
      temp_hp: c.temp_hp,
      spell_slots: structuredClone(c.spell_slots),
      actions: pc.actions.map(a => {
        const cAction = c.actions.find(x => x.id === a.id);
        if (cAction && a.uses_max != null) {
          if ((cAction.uses_remaining ?? a.uses_max) < a.uses_max) summary.usesSpent++;
          return { ...a, uses_remaining: cAction.uses_remaining ?? a.uses_max };
        }
        return a;
      }),
      bonus_actions: pc.bonus_actions.map(a => {
        const cAction = c.bonus_actions.find(x => x.id === a.id);
        if (cAction && a.uses_max != null) {
          return { ...a, uses_remaining: cAction.uses_remaining ?? a.uses_max };
        }
        return a;
      }),
      reactions: pc.reactions.map(a => {
        const cAction = c.reactions.find(x => x.id === a.id);
        if (cAction && a.uses_max != null) {
          return { ...a, uses_remaining: cAction.uses_remaining ?? a.uses_max };
        }
        return a;
      }),
    };

    if (c.current_hp < pc.current_hp) summary.damaged++;
    for (const lvl of Object.keys(c.spell_slots)) {
      const level = Number(lvl);
      const cSlot = c.spell_slots[level];
      const pcSlot = pc.spell_slots[level];
      if (pcSlot && cSlot.remaining < pcSlot.remaining) {
        summary.slotsSpent += pcSlot.remaining - cSlot.remaining;
      }
    }

    update(c.id, patch);
  }

  if (summary.damaged + summary.slotsSpent + summary.usesSpent > 0) {
    const parts: string[] = [];
    if (summary.damaged) parts.push(`${summary.damaged} PC${summary.damaged === 1 ? '' : 's'} damaged`);
    if (summary.slotsSpent) parts.push(`${summary.slotsSpent} spell slot${summary.slotsSpent === 1 ? '' : 's'} spent`);
    if (summary.usesSpent) parts.push(`${summary.usesSpent} action use${summary.usesSpent === 1 ? '' : 's'} consumed`);
    useToastStore.getState().push(`Party updated · ${parts.join(', ')}.`);
  } else {
    useToastStore.getState().push('Party updated · no changes.');
  }
}

function pushSnapshot(past: Encounter[], current: Encounter): Encounter[] {
  const next = [...past, structuredClone(current)];
  return next.length > MAX_UNDO ? next.slice(next.length - MAX_UNDO) : next;
}

function updateCombatant(
  combatants: Combatant[],
  id: string,
  updater: (c: Combatant) => Combatant,
): Combatant[] {
  return combatants.map(c => (c.id === id ? updater(c) : c));
}

function updateActionInCombatant(
  combatant: Combatant,
  actionId: string,
  updater: (a: CombatantAction) => CombatantAction,
): Combatant {
  return {
    ...combatant,
    actions: combatant.actions.map(a => (a.id === actionId ? updater(a) : a)),
    bonus_actions: combatant.bonus_actions.map(a => (a.id === actionId ? updater(a) : a)),
    reactions: combatant.reactions.map(a => (a.id === actionId ? updater(a) : a)),
    legendary_actions: combatant.legendary_actions?.map(a =>
      a.id === actionId ? updater(a) : a,
    ),
  };
}

function computeRecommended(encounter: Encounter): RecommendedAction[] {
  if (!encounter.tactics_enabled) return [];
  const current = encounter.combatants[encounter.current_turn_index];
  if (!current) return [];
  return getRecommendedActions(current, encounter.combatants);
}

export const useEncounterStore = create<EncounterStore>()(
  subscribeWithSelector((set, get) => ({
    encounter: INITIAL_ENCOUNTER,
    past: [],
    rootPath: null,
    recommendedActions: [],

    openDirectory: async () => {
      const selected = await window.electronAPI.selectFolder();
      if (!selected) return;
      localStorage.setItem(ROOT_PATH_KEY, selected);
      set({ rootPath: selected });
      await useCampaignStore.getState().loadFromRoot(selected);
      const campaign = useCampaignStore.getState().campaign;
      if (campaign) {
        const resumed = await loadLatestEncounter(selected, campaign.id);
        if (resumed) {
          set({ encounter: resumed, past: [], recommendedActions: computeRecommended(resumed) });
        } else {
          const { encounter: current } = get();
          set({
            encounter: { ...current, campaign_id: campaign.id, updated_at: new Date().toISOString() },
          });
        }
      }
    },

    loadEncounterFromFile: async (file: File) => {
      const text = await file.text();
      const encounter = JSON.parse(text) as Encounter;
      set({
        encounter,
        past: [],
        recommendedActions: computeRecommended(encounter),
      });
    },

    createNewEncounter: (name: string, campaignId: string, tacticsEnabled: boolean) => {
      const now = new Date().toISOString();
      const newEncounter: Encounter = {
        id: crypto.randomUUID(),
        campaign_id: campaignId,
        name,
        status: 'setup',
        tactics_enabled: tacticsEnabled,
        current_round: 1,
        current_turn_index: 0,
        combatants: [],
        combat_log: [],
        created_at: now,
        updated_at: now,
      };
      set({ encounter: newEncounter, past: [], recommendedActions: [] });
    },

    updateEncounterMeta: (name: string, campaignId: string, tacticsEnabled: boolean) => {
      const { encounter } = get();
      const newEncounter: Encounter = {
        ...encounter,
        name,
        campaign_id: campaignId,
        tactics_enabled: tacticsEnabled,
        updated_at: new Date().toISOString(),
      };
      set({ encounter: newEncounter, recommendedActions: computeRecommended(newEncounter) });
    },

    addCombatant: (combatant: Combatant) => {
      const { encounter } = get();
      set({
        encounter: {
          ...encounter,
          combatants: [...encounter.combatants, combatant],
          updated_at: new Date().toISOString(),
        },
      });
    },

    removeCombatant: (id: string) => {
      const { encounter } = get();
      set({
        encounter: {
          ...encounter,
          combatants: encounter.combatants.filter(c => c.id !== id),
          updated_at: new Date().toISOString(),
        },
      });
    },

    setCombatantArchetype: (id, archetype) => {
      const { encounter, past } = get();
      const newCombatants = updateCombatant(encounter.combatants, id, c => ({ ...c, archetype }));
      const newEncounter: Encounter = {
        ...encounter,
        combatants: newCombatants,
        updated_at: new Date().toISOString(),
      };
      set({
        encounter: newEncounter,
        past: pushSnapshot(past, encounter),
        recommendedActions: computeRecommended(newEncounter),
      });
    },

    setAllInitiatives: (values: Record<string, number>) => {
      const { encounter } = get();
      const newCombatants = encounter.combatants.map(c => ({
        ...c,
        initiative: values[c.id] ?? null,
      }));
      set({
        encounter: { ...encounter, combatants: newCombatants, updated_at: new Date().toISOString() },
      });
    },

    startCombat: () => {
      const { encounter, past } = get();
      const sorted = [...encounter.combatants].sort((a, b) => {
        const ai = a.initiative ?? -Infinity;
        const bi = b.initiative ?? -Infinity;
        return bi - ai;
      });
      const newEncounter: Encounter = {
        ...encounter,
        combatants: sorted,
        status: 'active',
        current_turn_index: 0,
        current_round: 1,
        updated_at: new Date().toISOString(),
      };
      set({
        encounter: newEncounter,
        past: pushSnapshot(past, encounter),
        recommendedActions: computeRecommended(newEncounter),
      });
    },

    advanceTurn: () => {
      const { encounter, past } = get();
      const total = encounter.combatants.length;
      if (total === 0) return;

      const newPast = pushSnapshot(past, encounter);
      let newIndex = encounter.current_turn_index + 1;
      let newRound = encounter.current_round;
      if (newIndex >= total) {
        newIndex = 0;
        newRound += 1;
      }

      const incoming = encounter.combatants[newIndex];
      const resetCombatant: Combatant = {
        ...incoming,
        actions: incoming.actions.map(a => ({ ...a, available: true })),
        bonus_actions: incoming.bonus_actions.map(a => ({ ...a, available: true })),
        reactions: incoming.reactions.map(a => ({ ...a, available: true })),
        legendary_actions_remaining:
          incoming.legendary_actions_max > 0
            ? incoming.legendary_actions_max
            : incoming.legendary_actions_remaining,
      };

      const newCombatants = encounter.combatants.map((c, i) =>
        i === newIndex ? resetCombatant : c,
      );

      const newEncounter: Encounter = {
        ...encounter,
        current_turn_index: newIndex,
        current_round: newRound,
        combatants: newCombatants,
        updated_at: new Date().toISOString(),
      };

      set({
        encounter: newEncounter,
        past: newPast,
        recommendedActions: computeRecommended(newEncounter),
      });
    },

    setEncounterStatus: (status: EncounterStatus) => {
      const { encounter, past } = get();
      const prevStatus = encounter.status;
      set({
        encounter: { ...encounter, status, updated_at: new Date().toISOString() },
        past: pushSnapshot(past, encounter),
      });
      if (status === 'done' && prevStatus !== 'done') {
        writeBackToRoster(get().encounter);
      }
    },

    applyDamage: (combatantId, amount, damageType) => {
      const { encounter, past } = get();
      const combatant = encounter.combatants.find(c => c.id === combatantId);
      if (!combatant) return;
      const result = damageEngineApply(combatant, amount, damageType);
      const newCombatants = updateCombatant(encounter.combatants, combatantId, c => ({
        ...c,
        current_hp: result.newHp,
        temp_hp: result.newTempHp,
      }));
      set({
        encounter: { ...encounter, combatants: newCombatants, updated_at: new Date().toISOString() },
        past: pushSnapshot(past, encounter),
      });
    },

    healCombatant: (combatantId, amount) => {
      const { encounter, past } = get();
      const newCombatants = updateCombatant(encounter.combatants, combatantId, c => ({
        ...c,
        current_hp: Math.min(c.max_hp, c.current_hp + amount),
      }));
      set({
        encounter: { ...encounter, combatants: newCombatants, updated_at: new Date().toISOString() },
        past: pushSnapshot(past, encounter),
      });
    },

    setTempHp: (combatantId, amount) => {
      const { encounter, past } = get();
      const newCombatants = updateCombatant(encounter.combatants, combatantId, c => ({
        ...c,
        temp_hp: Math.max(0, amount),
      }));
      set({
        encounter: { ...encounter, combatants: newCombatants, updated_at: new Date().toISOString() },
        past: pushSnapshot(past, encounter),
      });
    },

    applyCondition: (combatantId, condition, source?) => {
      const { encounter, past } = get();
      const conditionInstance: ConditionInstance = { condition, source };
      const newCombatants = updateCombatant(encounter.combatants, combatantId, c => ({
        ...c,
        conditions: [...c.conditions, conditionInstance],
      }));
      set({
        encounter: { ...encounter, combatants: newCombatants, updated_at: new Date().toISOString() },
        past: pushSnapshot(past, encounter),
      });
    },

    removeCondition: (combatantId, index) => {
      const { encounter, past } = get();
      const newCombatants = updateCombatant(encounter.combatants, combatantId, c => ({
        ...c,
        conditions: c.conditions.filter((_, i) => i !== index),
      }));
      set({
        encounter: { ...encounter, combatants: newCombatants, updated_at: new Date().toISOString() },
        past: pushSnapshot(past, encounter),
      });
    },

    useAction: (combatantId, actionId) => {
      const { encounter, past } = get();
      const newCombatants = updateCombatant(encounter.combatants, combatantId, c =>
        updateActionInCombatant(c, actionId, a => ({
          ...a,
          available: false,
          uses_remaining:
            a.uses_remaining !== undefined ? Math.max(0, a.uses_remaining - 1) : undefined,
        })),
      );
      set({
        encounter: { ...encounter, combatants: newCombatants, updated_at: new Date().toISOString() },
        past: pushSnapshot(past, encounter),
      });
    },

    useReaction: (combatantId) => {
      const { encounter, past } = get();
      const newCombatants = updateCombatant(encounter.combatants, combatantId, c => ({
        ...c,
        reactions: c.reactions.map(r => ({ ...r, available: false })),
      }));
      set({
        encounter: { ...encounter, combatants: newCombatants, updated_at: new Date().toISOString() },
        past: pushSnapshot(past, encounter),
      });
    },

    consumeSpellSlot: (combatantId, level) => {
      const { encounter, past } = get();
      const newCombatants = updateCombatant(encounter.combatants, combatantId, c => {
        const slot = c.spell_slots[level];
        if (!slot || slot.remaining <= 0) return c;
        return {
          ...c,
          spell_slots: { ...c.spell_slots, [level]: { ...slot, remaining: slot.remaining - 1 } },
        };
      });
      set({
        encounter: { ...encounter, combatants: newCombatants, updated_at: new Date().toISOString() },
        past: pushSnapshot(past, encounter),
      });
    },

    markActionAvailable: (combatantId, actionId) => {
      const { encounter, past } = get();
      const newCombatants = updateCombatant(encounter.combatants, combatantId, c =>
        updateActionInCombatant(c, actionId, a => ({
          ...a,
          available: true,
          uses_remaining: a.uses_max,
        })),
      );
      set({
        encounter: { ...encounter, combatants: newCombatants, updated_at: new Date().toISOString() },
        past: pushSnapshot(past, encounter),
      });
    },

    commitAction: (payload: CommitActionPayload) => {
      const { encounter, past } = get();
      const newPast = pushSnapshot(past, encounter);

      let newCombatants = [...encounter.combatants];

      if (payload.damageTargets) {
        for (const target of payload.damageTargets) {
          const combatant = newCombatants.find(c => c.id === target.id);
          if (!combatant) continue;
          const result = damageEngineApply(combatant, target.amount, target.damageType);
          newCombatants = newCombatants.map(c =>
            c.id === target.id ? { ...c, current_hp: result.newHp, temp_hp: result.newTempHp } : c,
          );
        }
      }

      if (payload.conditionTargets) {
        for (const ct of payload.conditionTargets) {
          newCombatants = newCombatants.map(c =>
            c.id === ct.id
              ? { ...c, conditions: [...c.conditions, { condition: ct.condition, source: ct.source }] }
              : c,
          );
        }
      }

      newCombatants = newCombatants.map(c => {
        if (c.id !== payload.actorId) return c;
        return updateActionInCombatant(c, payload.actionId, a => ({
          ...a,
          available: false,
          uses_remaining:
            a.uses_remaining !== undefined ? Math.max(0, a.uses_remaining - 1) : undefined,
        }));
      });

      if (payload.consumeSpellSlotLevel !== undefined) {
        const level = payload.consumeSpellSlotLevel;
        newCombatants = newCombatants.map(c => {
          if (c.id !== payload.actorId) return c;
          const slot = c.spell_slots[level];
          if (!slot || slot.remaining <= 0) return c;
          return {
            ...c,
            spell_slots: { ...c.spell_slots, [level]: { ...slot, remaining: slot.remaining - 1 } },
          };
        });
      }

      const newEncounter: Encounter = {
        ...encounter,
        combatants: newCombatants,
        combat_log: [...encounter.combat_log, payload.entry],
        updated_at: new Date().toISOString(),
      };

      set({
        encounter: newEncounter,
        past: newPast,
        recommendedActions: computeRecommended(newEncounter),
      });
    },

    logAction: (entry: CombatLogEntry) => {
      const { encounter, past } = get();
      set({
        encounter: {
          ...encounter,
          combat_log: [...encounter.combat_log, entry],
          updated_at: new Date().toISOString(),
        },
        past: pushSnapshot(past, encounter),
      });
    },

    undoLastAction: () => {
      const { past } = get();
      if (past.length === 0) return;
      const previous = past[past.length - 1];
      set({
        encounter: previous,
        past: past.slice(0, -1),
        recommendedActions: computeRecommended(previous),
      });
    },
  })),
);
