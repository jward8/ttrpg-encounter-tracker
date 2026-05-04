# D&D Combat Tracker — Product Roadmap

Each phase must be complete and stable before the next begins. The ordering is intentional: logic before UI, static before wired, core before optional.

---

## Phase 1 — Core Logic & Data Foundation

**Goal:** All engine code is solid and tested before any UI is touched. Bugs caught here are cheap; bugs caught in Phase 3+ are expensive.

### Tasks
- [ ] Define all TypeScript types in `src/fileSystem/schema.ts`
  - `CombatantType`, `ActionCategory`, `DamageType`, `SrdCondition`, `Archetype`, `RangeHint`
  - `CombatantAction`, `SpellSlots`, `ConditionInstance`, `Combatant`
  - `CombatLogEntry`, `EncounterStatus`, `Encounter`
  - `PlayerCharacter`, `Campaign`
- [ ] Implement `src/engine/damageEngine.ts`
  - Immunity (zero damage), resistance (half), vulnerability (double)
  - Temp HP absorption before real HP
- [ ] Write unit tests for `damageEngine.ts`
  - Immunity, resistance, vulnerability each tested in isolation
  - Temp HP absorbs first, remainder hits real HP
  - HP floors at 0
- [ ] Implement `src/engine/archetypes.ts`
  - All 8 archetype definitions (`glass_cannon`, `brute`, `skirmisher`, `protector`, `controller`, `support`, `boss`, `survivor`)
  - `suggestArchetype()` heuristic function
- [ ] Implement `src/engine/tacticEngine.ts`
  - `getRecommendedActions()` — pure function, no side effects
  - `matchesArchetypePriority()` matching logic
  - `getRangeReason()` annotation strings
- [ ] Write unit tests for `tacticEngine.ts`
  - Returns empty array when no archetype assigned
  - Correctly recommends melee for brute, ranged for glass_cannon, area for controller
  - Filters out unavailable actions
- [ ] Implement `src/fileSystem/encounterIO.ts`
  - `saveEncounter()` — writes to `<campaign_id>/encounters/<encounter_id>.json`
  - `loadEncounter()` — parses JSON back to `Encounter` type
- [ ] Implement `src/hooks/useFileSystem.ts`
  - Wraps File System Access API
  - Handles directory handle creation

### Done When
- All unit tests pass
- No UI has been built yet
- `schema.ts` has zero `any` types

---

## Phase 2 — Static UI Prototype (No State)

**Goal:** The DM can look at the layout and confirm it feels right before a single line of real state is written. Layout mistakes are free to fix here; they are expensive after wiring.

### Tasks
- [ ] Scaffold Vite + React + TypeScript + Tailwind project
- [ ] Set up `App.tsx` with a two-panel layout (initiative list left, action panel right)
- [ ] Build `src/components/combat/CombatantCard.tsx`
  - Name, type indicator (PC / ally / enemy), current HP, AC, condition badges
  - Hardcoded fake data
- [ ] Build `src/components/combat/InitiativeList.tsx`
  - Ordered list of `CombatantCard` components
  - Current-turn highlight (border/background)
  - Next-turn subtle indicator
  - Clicking a row opens read-only stat view
- [ ] Build `src/components/combat/ConditionBadge.tsx`
  - Visual pill for each active condition
- [ ] Build `src/components/combat/ActionCard.tsx`
  - Normal state: name, attack bonus, damage, range
  - Recommended state: colored highlight border + one-line annotation
  - Unavailable state: opacity-40, `[SPENT]` label
- [ ] Build `src/components/combat/ActionPanel.tsx`
  - Header: combatant name, archetype badge, round number
  - HP controls: current / max, damage input, heal input
  - Action row, Bonus Action row (visually separated)
  - Reaction slot toggle (Available / Used)
  - Log button per action
- [ ] Build `src/components/combat/HpTracker.tsx`
  - Damage and heal inputs with +/- controls
- [ ] Build `src/components/combat/ResourceTracker.tsx`
  - Spell slots display (level + remaining / max)
  - Limited-use and recharge ability tracking
- [ ] Build `src/components/combat/CombatLog.tsx`
  - Scrollable log with hardcoded entries
- [ ] Validate layout at 1280px (desktop) and 768px (iPad) viewport widths

### Done When
- A DM can look at the app and recognize a functional combat tracker
- All fake data is clearly marked as placeholder
- No `useState`, no store, no file I/O — pure render

---

## Phase 3 — Wire State (Zustand Store)

**Goal:** The app is functional end-to-end with manually typed data. A real combat encounter can be run from round 1 to end without leaving the app.

### Tasks
- [ ] Build `src/store/encounterStore.ts` with the following actions:
  - `advanceTurn()` — increment turn index, wrap to next round
  - `applyDamage(combatantId, amount, damageType)` — calls `damageEngine`, updates HP
  - `healCombatant(combatantId, amount)`
  - `setTempHp(combatantId, amount)`
  - `applyCondition(combatantId, condition)`
  - `removeCondition(combatantId, conditionId)`
  - `useAction(combatantId, actionId)` — marks action used this turn
  - `useReaction(combatantId)`
  - `consumeSpellSlot(combatantId, level)`
  - `logAction(entry: CombatLogEntry)` — appends to combat log
  - `undoLastAction()` — reverts last log entry and its side effects
  - `setEncounterStatus(status: EncounterStatus)`
- [ ] Auto-save to JSON on every store mutation (call `encounterIO.saveEncounter` in store middleware)
- [ ] Connect `InitiativeList` to store
- [ ] Connect `ActionPanel` to store — active turn driven by `current_turn_index`
- [ ] Connect `HpTracker` to store — damage/heal updates `current_hp`
- [ ] Connect `ActionCard` — tap marks action used, triggers log entry flow
- [ ] Connect `ResourceTracker` — spell slot and use decrements persist
- [ ] Connect `CombatLog` — live feed from `combat_log` array
- [ ] Implement log entry flow on action tap:
  1. Mark action selected
  2. Optional: prompt for target
  3. Optional: prompt for to-hit roll
  4. Optional: prompt for damage amount
  5. Append `CombatLogEntry`, decrement resource

### Done When
- A DM can manually type in combatants and run a full combat to completion
- Closing and reopening the app restores exact state from the JSON file
- `undoLastAction` correctly reverts HP, conditions, and resources

---

## Phase 4 — Encounter Setup Flow

**Goal:** A DM can create an encounter from scratch — no manual JSON editing required. Campaign and character roster persist across sessions.

### Tasks
- [ ] Build `src/fileSystem/campaignIO.ts`
  - `saveCampaign()` / `loadCampaign()` — reads/writes `campaign.json`
- [ ] Build `src/store/campaignStore.ts`
  - Stores `Campaign` (id, name, player_characters)
  - Actions: `addPlayerCharacter`, `updatePlayerCharacter`, `removePlayerCharacter`
- [ ] Build `src/components/encounter/CombatantForm.tsx`
  - Fields for all `Combatant` properties: name, type, AC, max HP, speed, initiative modifier
  - Resistance / immunity / vulnerability selectors
  - Action entry (name, category, damage, range hint, uses)
- [ ] Build `src/components/encounter/EncounterSetup.tsx`
  - Create new encounter (name, campaign link, tactics toggle)
  - Add PCs from campaign roster (pre-fills stats)
  - Add enemy NPCs via `CombatantForm`
  - Review combatant list before proceeding
- [ ] Build `src/components/encounter/InitiativeInput.tsx`
  - List of all combatants, input field per row for rolled initiative value
  - Sort preview updates live as values are entered
  - Confirm to transition encounter to `active` status
- [ ] Wire file-picker on app load: open existing encounter or start setup flow
- [ ] Campaign management screen: create campaign, manage PC roster

### Done When
- DM can go from "open app" to "combat is running" without typing in any JSON
- PC roster persists — adding PCs once reuses them across encounters
- Encounter resumes correctly from saved JSON after browser close

---

## Phase 5 — Tactics Layer

**Goal:** Tactics mode works end-to-end. Optional toggle, validated on a real encounter.

### Tasks
- [ ] Build `src/components/tactics/ArchetypeSelector.tsx`
  - Dropdown of all 8 archetypes + null (none)
  - Shows `suggestArchetype()` recommendation as default with override option
  - Description text for each archetype shown on hover/focus
- [ ] Build `src/components/tactics/ArchetypeBadge.tsx`
  - Small colored label: archetype name
  - Shown on `CombatantCard` and `ActionPanel` header
- [ ] Wire `tacticEngine.getRecommendedActions()` into `ActionPanel`
  - Only fires when `encounter.tactics_enabled === true`
  - Passes current combatant + all combatants to engine
- [ ] Apply recommendation highlight to `ActionCard`
  - Colored border + annotation text when action is in recommendations
  - Confidence level can adjust highlight intensity (`high` = solid, `medium` = dashed)
- [ ] Expose tactics toggle in encounter setup and in active encounter header
- [ ] Assign archetypes during encounter setup via `CombatantForm`

### Done When
- Tactics toggle on/off changes action card rendering in real time
- Archetype recommendations are correct for at least 3 archetype types in manual testing
- Tactics can be turned on mid-encounter without breaking state

---

## Post-MVP Backlog

These are explicitly out of scope until all 5 phases are complete.

- **SRD monster import** — fetch stat blocks from SRD API, pre-fill `CombatantForm`
- **Condition duration tracking** — auto-decrement `duration_rounds` on turn advance, alert when condition expires
- **Concentration tracking** — flag concentration spells, prompt when caster takes damage
- **Export combat log** — render `combat_log` as a readable markdown recap
- **Multi-encounter session** — run multiple encounters in a single session without creating a new campaign file
- **Mobile layout** — single-panel view optimized for phone (initiative list collapses to drawer)
- **Keyboard shortcuts** — advance turn, apply damage, open log

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
8. *(Optional)* Assign archetypes to NPCs and see highlighted action recommendations
