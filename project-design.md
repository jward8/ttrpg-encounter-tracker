# D&D Combat Tracker — Project Design

## What You Are Building

A local-first, DM-only D&D 5e combat encounter tracker. Built as a responsive web app (PWA) using React + TypeScript. All data is stored as human-readable JSON files on the user's machine. No backend, no database, no accounts required.

The app has two layers:
1. **Core tracker** — initiative, HP, conditions, actions, resources, combat log. Always present.
2. **Tactics layer** — archetype-based action highlighting. Optional, toggled per encounter.

---

## Tech Stack

- **Framework:** React 18 + TypeScript
- **Styling:** Tailwind CSS
- **File storage:** Browser File System Access API (for reading/writing JSON files to disk)
- **State management:** Zustand (lightweight, works well with local-first patterns)
- **Build tool:** Vite
- **Testing:** Vitest + React Testing Library

No backend. No database. No external API calls at MVP (SRD import is a separate feature).

---

## Project Structure

```
/src
  /components
    /combat
      InitiativeList.tsx        # Left panel — ordered combatant list
      CombatantCard.tsx         # Single combatant in initiative list
      ActionPanel.tsx           # Right panel — current turn actions
      ActionCard.tsx            # Individual action button/card
      HpTracker.tsx             # HP input with damage/heal controls
      ConditionBadge.tsx        # Visual condition indicator
      ResourceTracker.tsx       # Spell slots, limited uses, recharge
      CombatLog.tsx             # Scrollable event log
    /encounter
      EncounterSetup.tsx        # Create encounter, add combatants
      CombatantForm.tsx         # Add/edit a combatant's stats
      InitiativeInput.tsx       # Enter initiative values per combatant
    /tactics
      ArchetypeSelector.tsx     # Assign archetype to NPC
      ArchetypeBadge.tsx        # Small label showing assigned archetype
  /store
    encounterStore.ts           # Zustand store — active encounter state
    campaignStore.ts            # Campaign and character roster state
  /engine
    tacticEngine.ts             # Recommendation logic — pure functions
    archetypes.ts               # Archetype definitions and priority stacks
    damageEngine.ts             # Resistance / vulnerability / immunity math
  /fileSystem
    encounterIO.ts              # Read/write encounter JSON files
    campaignIO.ts               # Read/write campaign JSON files
    schema.ts                   # TypeScript types for all JSON schemas
  /hooks
    useEncounter.ts             # Combat state + actions
    useFileSystem.ts            # File System Access API wrapper
  /utils
    conditions.ts               # SRD condition definitions
    initiative.ts               # Sorting and turn-advance logic
  App.tsx
  main.tsx
```

---

## Data Schemas (TypeScript)

These are the source of truth for all data structures.

```typescript
// schema.ts

export type CombatantType = 'player_character' | 'allied_npc' | 'enemy_npc';

export type ActionCategory = 'action' | 'bonus_action' | 'reaction' | 'legendary' | 'lair' | 'free';

export type DamageType =
  | 'acid' | 'bludgeoning' | 'cold' | 'fire' | 'force'
  | 'lightning' | 'necrotic' | 'piercing' | 'poison'
  | 'psychic' | 'radiant' | 'slashing' | 'thunder';

export type SrdCondition =
  | 'blinded' | 'charmed' | 'deafened' | 'exhaustion'
  | 'frightened' | 'grappled' | 'incapacitated' | 'invisible'
  | 'paralyzed' | 'petrified' | 'poisoned' | 'prone'
  | 'restrained' | 'stunned' | 'unconscious';

export type Archetype =
  | 'glass_cannon' | 'brute' | 'skirmisher' | 'protector'
  | 'controller' | 'support' | 'boss' | 'survivor' | null;

export type RangeHint =
  | 'melee' | 'ranged_30' | 'ranged_60' | 'ranged_120'
  | 'self' | 'touch' | 'area' | 'any';

export interface CombatantAction {
  id: string;
  name: string;
  action_category: ActionCategory;
  description?: string;
  attack_bonus?: number;
  damage?: string;             // e.g. "1d6+2"
  damage_type?: DamageType;
  range_hint: RangeHint;
  save_dc?: number;
  save_ability?: string;
  recharge?: string;           // e.g. "5-6", "6"
  uses_max?: number;
  uses_remaining?: number;
  spell_slot_level?: number;
  available: boolean;          // false = greyed out in UI
}

export interface SpellSlots {
  [level: number]: {
    max: number;
    remaining: number;
  };
}

export interface ConditionInstance {
  condition: SrdCondition | string;
  source?: string;
  duration_rounds?: number;
  save_to_end?: boolean;
}

export interface Combatant {
  id: string;
  name: string;
  type: CombatantType;
  ac: number;
  max_hp: number;
  current_hp: number;
  temp_hp: number;
  speed: number;
  initiative: number | null;
  initiative_modifier: number;
  conditions: ConditionInstance[];
  actions: CombatantAction[];
  bonus_actions: CombatantAction[];
  reactions: CombatantAction[];
  spell_slots: SpellSlots;
  resistances: DamageType[];
  immunities: DamageType[];
  vulnerabilities: DamageType[];
  legendary_actions_max: number;
  legendary_actions_remaining: number;
  legendary_actions?: CombatantAction[];
  archetype: Archetype;
  source_document?: string;
  notes: string;
}

export interface CombatLogEntry {
  id: string;
  round: number;
  combatant_id: string;
  combatant_name: string;
  action_id?: string;
  action_name: string;
  action_category: ActionCategory;
  target_ids: string[];
  target_names: string[];
  roll_to_hit?: number;
  hit?: boolean;
  damage_amount?: number;
  damage_type?: DamageType;
  was_resisted?: boolean;
  was_doubled?: boolean;
  conditions_applied?: string[];
  resource_consumed?: string;
  notes?: string;
  timestamp: string;
}

export type EncounterStatus = 'setup' | 'initiative' | 'active' | 'paused' | 'done';

export interface Encounter {
  id: string;
  campaign_id: string;
  name: string;
  status: EncounterStatus;
  tactics_enabled: boolean;
  current_round: number;
  current_turn_index: number;
  combatants: Combatant[];       // sorted by initiative when status = 'active'
  combat_log: CombatLogEntry[];
  created_at: string;
  updated_at: string;
}

export interface PlayerCharacter {
  id: string;
  name: string;
  player_name: string;
  classes: string[];
  level: number;
  ac: number;
  max_hp: number;
  initiative_modifier: number;
  speed: number;
  spell_slots: SpellSlots;
  actions: CombatantAction[];
  bonus_actions: CombatantAction[];
  reactions: CombatantAction[];
  notes: string;
}

export interface Campaign {
  id: string;
  name: string;
  player_characters: PlayerCharacter[];
  created_at: string;
  updated_at: string;
}
```

---

## Archetype Definitions

```typescript
// archetypes.ts

export const ARCHETYPES = {
  glass_cannon: {
    label: 'Glass Cannon',
    description: 'Maximum offense every turn. Does not retreat.',
    priority: ['highest_damage_action', 'ranged_attack', 'melee_attack'],
    avoid: ['dash', 'dodge', 'disengage'],
  },
  brute: {
    label: 'Brute',
    description: 'Charges nearest target. Keeps swinging.',
    priority: ['melee_attack', 'multiattack', 'shove'],
    avoid: ['ranged_attack', 'hide'],
  },
  skirmisher: {
    label: 'Skirmisher',
    description: 'Attacks then repositions. Avoids being surrounded.',
    priority: ['attack_then_disengage', 'ranged_attack', 'hide'],
    avoid: ['stand_still'],
  },
  protector: {
    label: 'Protector',
    description: 'Stays near a designated ally. Interposes against threats.',
    priority: ['interpose', 'melee_attack', 'shove'],
    avoid: ['ranged_attack'],
  },
  controller: {
    label: 'Controller',
    description: 'Restricts and repositions enemies over raw damage.',
    priority: ['aoe_control', 'condition_apply', 'ranged_attack'],
    avoid: ['melee_attack'],
  },
  support: {
    label: 'Support',
    description: 'Heals and buffs allies first. Attacks only when no ally needs help.',
    priority: ['heal_ally', 'buff_ally', 'ranged_attack'],
    avoid: ['melee_attack'],
  },
  boss: {
    label: 'Boss',
    description: 'Uses strongest abilities without hesitation. Legendary actions always used.',
    priority: ['legendary_action', 'highest_damage_action', 'special_ability', 'multiattack'],
    avoid: ['dodge', 'hide'],
  },
  survivor: {
    label: 'Survivor',
    description: 'Self-preservation first. Disengages when threatened.',
    priority: ['disengage', 'dodge', 'ranged_attack', 'defensive_ability'],
    avoid: ['melee_attack'],
  },
} as const;

// Heuristic: suggest archetype from stat block
export function suggestArchetype(combatant: Combatant): Archetype {
  if (combatant.legendary_actions_max > 0) return 'boss';
  if (combatant.current_hp > 100) return 'brute';

  const hasRangedOnly = combatant.actions.every(a => a.range_hint !== 'melee');
  if (hasRangedOnly && combatant.max_hp < 30) return 'glass_cannon';
  if (hasRangedOnly) return 'skirmisher';

  const hasAoe = combatant.actions.some(a => a.range_hint === 'area');
  if (hasAoe) return 'controller';

  return 'brute'; // safe default
}
```

---

## Tactic Engine

```typescript
// tacticEngine.ts
// Pure functions — no side effects, fully testable.

import { Combatant, CombatantAction, Archetype } from './schema';
import { ARCHETYPES } from './archetypes';

export interface RecommendedAction {
  action: CombatantAction;
  reason: string;         // One-line annotation shown in UI
  confidence: 'high' | 'medium' | 'low';
}

export function getRecommendedActions(
  combatant: Combatant,
  allCombatants: Combatant[]
): RecommendedAction[] {
  if (!combatant.archetype) return [];

  const archetype = ARCHETYPES[combatant.archetype];
  const available = [
    ...combatant.actions,
    ...combatant.bonus_actions,
  ].filter(a => a.available);

  const recommendations: RecommendedAction[] = [];

  // Match available actions to archetype priority patterns
  for (const action of available) {
    const rangeReason = getRangeReason(action);
    const archetypeMatch = matchesArchetypePriority(action, archetype.priority);

    if (archetypeMatch) {
      recommendations.push({
        action,
        reason: rangeReason,
        confidence: 'high',
      });
    }
  }

  return recommendations;
}

function getRangeReason(action: CombatantAction): string {
  switch (action.range_hint) {
    case 'melee': return 'Recommended at melee';
    case 'ranged_30': return 'Recommended within 30 ft';
    case 'ranged_60': return 'Recommended within 60 ft';
    case 'ranged_120': return 'Recommended within 120 ft';
    case 'area': return 'Recommended vs. clustered targets';
    default: return 'Recommended';
  }
}

function matchesArchetypePriority(
  action: CombatantAction,
  priorities: readonly string[]
): boolean {
  // Simplified matching — expand as needed
  if (priorities.includes('highest_damage_action') && action.damage) return true;
  if (priorities.includes('melee_attack') && action.range_hint === 'melee') return true;
  if (priorities.includes('ranged_attack') && action.range_hint !== 'melee') return true;
  if (priorities.includes('aoe_control') && action.range_hint === 'area') return true;
  if (priorities.includes('legendary_action') && action.action_category === 'legendary') return true;
  return false;
}
```

---

## Damage Engine

```typescript
// damageEngine.ts

import { Combatant, DamageType } from './schema';

export function applyDamage(
  combatant: Combatant,
  rawAmount: number,
  damageType: DamageType
): { finalAmount: number; newHp: number; newTempHp: number; note: string } {
  let amount = rawAmount;
  let note = '';

  if (combatant.immunities.includes(damageType)) {
    return { finalAmount: 0, newHp: combatant.current_hp, newTempHp: combatant.temp_hp, note: 'Immune' };
  }
  if (combatant.resistances.includes(damageType)) {
    amount = Math.floor(amount / 2);
    note = 'Resisted (half damage)';
  }
  if (combatant.vulnerabilities.includes(damageType)) {
    amount = amount * 2;
    note = 'Vulnerable (double damage)';
  }

  let newTempHp = combatant.temp_hp;
  let newHp = combatant.current_hp;

  if (newTempHp > 0) {
    const tempAbsorbed = Math.min(newTempHp, amount);
    newTempHp -= tempAbsorbed;
    amount -= tempAbsorbed;
  }

  newHp = Math.max(0, newHp - amount);

  return { finalAmount: rawAmount, newHp, newTempHp, note };
}
```

---

## Key UI Behaviors

### Initiative List (left panel)
- Sorted descending by initiative value
- Current turn combatant: highlighted with a distinct border/background
- Next combatant: subtly indicated
- Each row shows: name, type indicator (PC / ally / enemy), current HP, AC, active condition badges
- Clicking a combatant row opens their stat detail (not their turn — read-only)

### Action Panel (right panel, active turn only)
- Header: combatant name, archetype badge (if assigned), round indicator
- HP controls: current / max, damage input, heal input
- **Action row:** cards for each available action. Recommended actions have a colored highlight border and a one-line annotation below ("Recommended at melee"). Unavailable actions greyed out (opacity-40) but still rendered.
- **Bonus Action row:** visually separated from Action row, same card treatment
- **Reaction slot:** shows "Available" or "Used" — single toggle
- Log button: confirms the action was taken, opens roll result entry (optional)

### Action Card

```
┌─────────────────────────────┐
│  Scimitar              [✦]  │  ← highlight indicator if recommended
│  +4 to hit · 1d6+2 slash   │
│  ─────────────────────────  │
│  Recommended at melee       │  ← annotation, only shown if recommended
└─────────────────────────────┘
```

Greyed out card (unavailable):

```
┌─────────────────────────────┐  ← opacity-40, no highlight
│  Fireball (3rd)   [SPENT]   │
│  DC 14 Dex · 8d6 fire      │
└─────────────────────────────┘
```

### Log Entry Flow
When DM taps an action card:
1. Mark action as "selected this turn"
2. Prompt: target? (optional — can skip)
3. Prompt: to-hit roll result? (optional — can skip)
4. Prompt: damage amount? (optional — can skip)
5. Append to combat log, decrement resource if applicable

---

## File System Access API Pattern

```typescript
// useFileSystem.ts

export function useFileSystem() {
  const saveEncounter = async (encounter: Encounter, dirHandle: FileSystemDirectoryHandle) => {
    const campaignDir = await dirHandle.getDirectoryHandle(encounter.campaign_id, { create: true });
    const encounterDir = await campaignDir.getDirectoryHandle('encounters', { create: true });
    const fileHandle = await encounterDir.getFileHandle(`${encounter.id}.json`, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(encounter, null, 2));
    await writable.close();
  };

  const loadEncounter = async (fileHandle: FileSystemFileHandle): Promise<Encounter> => {
    const file = await fileHandle.getFile();
    const text = await file.text();
    return JSON.parse(text) as Encounter;
  };

  return { saveEncounter, loadEncounter };
}
```

---

## Build Order

### Step 1 — Schema + Engine (no UI)
- Define all TypeScript types in `schema.ts`
- Implement `damageEngine.ts` with unit tests
- Implement `archetypes.ts` and `tacticEngine.ts` with unit tests
- Implement `encounterIO.ts` file read/write with the File System Access API

**Goal:** Core logic is solid and tested before any UI is built.

### Step 2 — Static UI Prototype (hardcoded data)
- Build `InitiativeList`, `CombatantCard`, `ActionPanel`, `ActionCard` with fake hardcoded data
- No store, no file system, no real state — just pixels
- Validate layout on desktop and iPad viewport

**Goal:** The DM can look at the UI and confirm it feels right before wiring real state.

### Step 3 — Wire State (Zustand store)
- Build `encounterStore.ts` with actions: advanceTurn, applyDamage, applyCondition, logAction, undoLastAction
- Connect UI components to store
- Encounter auto-saves to JSON on every store mutation

**Goal:** The app is functional end-to-end with manually entered data.

### Step 4 — Encounter Setup Flow
- Build `EncounterSetup`, `CombatantForm`, `InitiativeInput`
- Campaign and character roster persistence

**Goal:** DM can create an encounter from scratch, enter combatants, roll initiative, and start combat.

### Step 5 — Tactics Layer
- Build `ArchetypeSelector`, `ArchetypeBadge`
- Wire `tacticEngine.getRecommendedActions()` into `ActionPanel`
- Highlight recommended action cards
- Tactics toggle on encounter setup

**Goal:** Tactics mode works end-to-end. Can be validated on a real encounter.

---

## MVP Success Criteria

A DM can:
1. Open the app, create a campaign, add their player characters once
2. Create a new encounter, add a mix of PCs and enemy NPCs with their stats
3. Enter initiative values as players roll around the table
4. Run combat turn by turn — tracking HP, conditions, and resources — without leaving the app
5. Log what each combatant does each turn, with optional roll results and targets
6. Resume the encounter in the exact same state after closing and reopening the app
7. Mark the encounter done when combat ends

Optionally:
8. Assign archetypes to NPCs and see highlighted action recommendations during their turns
