import InitiativeList from './components/combat/InitiativeList';
import ActionPanel from './components/combat/ActionPanel';
import CombatLog from './components/combat/CombatLog';
import {
  FAKE_COMBATANTS,
  FAKE_LOG_ENTRIES,
  FAKE_CURRENT_TURN_INDEX,
  FAKE_ROUND,
  FAKE_RECOMMENDED_ACTION_IDS,
} from './components/combat/fakeCombatData';

export default function App() {
  const activeCombatant = FAKE_COMBATANTS[FAKE_CURRENT_TURN_INDEX];

  return (
    <div className="h-screen bg-stone-950 text-stone-100 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-12 bg-stone-900 border-b border-stone-700 flex items-center px-4 gap-4 shrink-0">
        <h1 className="text-sm font-semibold uppercase tracking-widest text-amber-400">
          Tomb of Annihilation — Session 12
        </h1>
        <span className="text-stone-500 text-sm">Round {FAKE_ROUND}</span>
        <span className="ml-auto text-[10px] text-stone-600 uppercase tracking-wider">
          [prototype — hardcoded data]
        </span>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Initiative List */}
        <aside className="w-72 md:w-80 shrink-0 border-r border-stone-700 overflow-hidden flex flex-col">
          <InitiativeList
            combatants={FAKE_COMBATANTS}
            currentTurnIndex={FAKE_CURRENT_TURN_INDEX}
          />
        </aside>

        {/* Right: Action Panel + Combat Log */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4">
            {activeCombatant && (
              <ActionPanel
                combatant={activeCombatant}
                currentRound={FAKE_ROUND}
                recommendedActionIds={FAKE_RECOMMENDED_ACTION_IDS}
              />
            )}
          </div>
          <div className="h-40 shrink-0 border-t border-stone-700 bg-stone-900">
            <CombatLog entries={FAKE_LOG_ENTRIES} />
          </div>
        </main>
      </div>
    </div>
  );
}
