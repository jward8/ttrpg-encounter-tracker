import { useEffect, useRef, useState } from 'react';
import { useEncounterStore } from './store/encounterStore';
import { saveEncounter } from './fileSystem/encounterIO';
import type { CombatantAction, DamageType } from './fileSystem/schema';
import InitiativeList from './components/combat/InitiativeList';
import ActionPanel from './components/combat/ActionPanel';
import CombatLog from './components/combat/CombatLog';
import LogEntryModal from './components/combat/LogEntryModal';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function App() {
  const encounter = useEncounterStore(s => s.encounter);
  const past = useEncounterStore(s => s.past);
  const dirHandle = useEncounterStore(s => s.dirHandle);
  const recommendedActionIds = useEncounterStore(s => s.recommendedActionIds);

  const advanceTurn = useEncounterStore(s => s.advanceTurn);
  const undoLastAction = useEncounterStore(s => s.undoLastAction);
  const openDirectory = useEncounterStore(s => s.openDirectory);
  const loadEncounterFromFile = useEncounterStore(s => s.loadEncounterFromFile);
  const applyDamage = useEncounterStore(s => s.applyDamage);
  const healCombatant = useEncounterStore(s => s.healCombatant);
  const setTempHp = useEncounterStore(s => s.setTempHp);
  const useReaction = useEncounterStore(s => s.useReaction);
  const applyCondition = useEncounterStore(s => s.applyCondition);
  const removeCondition = useEncounterStore(s => s.removeCondition);
  const commitAction = useEncounterStore(s => s.commitAction);

  const [selectedCombatantId, setSelectedCombatantId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{ combatantId: string; action: CombatantAction } | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-save on every encounter mutation when a directory is open
  useEffect(() => {
    const unsub = useEncounterStore.subscribe(
      s => s.encounter,
      enc => {
        const { dirHandle: dh } = useEncounterStore.getState();
        if (!dh) return;
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        setSaveStatus('saving');
        saveTimeoutRef.current = setTimeout(async () => {
          const { dirHandle: currentDh } = useEncounterStore.getState();
          if (!currentDh) { setSaveStatus('idle'); return; }
          try {
            await saveEncounter(enc, currentDh);
            setSaveStatus('saved');
          } catch {
            setSaveStatus('error');
          }
        }, 500);
      },
    );
    return () => {
      unsub();
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!dirHandle) setSaveStatus('idle');
  }, [dirHandle]);

  const activeCombatant = encounter.combatants[encounter.current_turn_index] ?? null;

  const selectedCombatant = selectedCombatantId
    ? (encounter.combatants.find(c => c.id === selectedCombatantId) ?? null)
    : null;

  // Show active turn panel when nothing is selected or when active combatant is selected
  const isViewingActive = !selectedCombatant || selectedCombatant.id === activeCombatant?.id;
  const displayCombatant = isViewingActive ? activeCombatant : selectedCombatant;

  function handleSelectCombatant(id: string) {
    setSelectedCombatantId(prev => (prev === id ? null : id));
  }

  function handleLoadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      loadEncounterFromFile(file);
      setSelectedCombatantId(null);
      setPendingAction(null);
    }
    e.target.value = '';
  }

  const saveLabel =
    saveStatus === 'idle' ? 'No folder' :
    saveStatus === 'saving' ? 'Saving…' :
    saveStatus === 'error' ? 'Save error' :
    'Saved';

  const saveLabelColor =
    saveStatus === 'idle' ? 'text-stone-600' :
    saveStatus === 'saving' ? 'text-yellow-400' :
    saveStatus === 'error' ? 'text-red-400' :
    'text-emerald-400';

  return (
    <div className="h-screen bg-stone-950 text-stone-100 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-12 bg-stone-900 border-b border-stone-700 flex items-center px-4 gap-3 shrink-0">
        <h1 className="text-sm font-semibold uppercase tracking-widest text-amber-400">
          {encounter.name}
        </h1>
        <span className="text-stone-500 text-sm">Round {encounter.current_round}</span>

        <div className="flex items-center gap-2 ml-auto">
          <span className={`text-[10px] uppercase tracking-wider ${saveLabelColor}`}>
            {saveLabel}
          </span>
          <button
            onClick={() => openDirectory().catch(() => {})}
            className="text-xs text-stone-400 hover:text-stone-200 px-2 py-1 rounded border border-stone-700 hover:border-stone-500 transition-colors"
          >
            Open Folder
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-xs text-stone-400 hover:text-stone-200 px-2 py-1 rounded border border-stone-700 hover:border-stone-500 transition-colors"
          >
            Load
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleLoadFile}
          />
          <button
            onClick={undoLastAction}
            disabled={past.length === 0}
            className="text-xs px-2 py-1 rounded border border-stone-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-stone-400 hover:text-stone-200 hover:border-stone-500"
          >
            Undo
          </button>
          <button
            onClick={advanceTurn}
            className="text-xs bg-amber-600 hover:bg-amber-500 text-white font-semibold px-3 py-1.5 rounded transition-colors"
          >
            End Turn
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Initiative List */}
        <aside className="w-72 md:w-80 shrink-0 border-r border-stone-700 overflow-hidden flex flex-col">
          <InitiativeList
            combatants={encounter.combatants}
            currentTurnIndex={encounter.current_turn_index}
            selectedCombatantId={selectedCombatantId ?? undefined}
            onSelectCombatant={handleSelectCombatant}
          />
        </aside>

        {/* Right: Action Panel + Combat Log */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4">
            {displayCombatant ? (
              <>
                {!isViewingActive && (
                  <div className="mb-4 px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-400">
                    Viewing {displayCombatant.name} — not their turn
                  </div>
                )}
                <ActionPanel
                  combatant={displayCombatant}
                  currentRound={encounter.current_round}
                  recommendedActionIds={isViewingActive ? recommendedActionIds : []}
                  onActionClick={
                    isViewingActive && activeCombatant
                      ? (action: CombatantAction) =>
                          setPendingAction({ combatantId: activeCombatant.id, action })
                      : undefined
                  }
                  onDamage={
                    isViewingActive && activeCombatant
                      ? (amount: number, type: DamageType) =>
                          applyDamage(activeCombatant.id, amount, type)
                      : undefined
                  }
                  onHeal={
                    isViewingActive && activeCombatant
                      ? (amount: number) => healCombatant(activeCombatant.id, amount)
                      : undefined
                  }
                  onSetTempHp={
                    isViewingActive && activeCombatant
                      ? (amount: number) => setTempHp(activeCombatant.id, amount)
                      : undefined
                  }
                  onReactionUse={
                    isViewingActive && activeCombatant
                      ? () => useReaction(activeCombatant.id)
                      : undefined
                  }
                  onApplyCondition={
                    isViewingActive && activeCombatant
                      ? (cond: string) => applyCondition(activeCombatant.id, cond)
                      : undefined
                  }
                  onRemoveCondition={
                    isViewingActive && activeCombatant
                      ? (i: number) => removeCondition(activeCombatant.id, i)
                      : undefined
                  }
                />
              </>
            ) : (
              <p className="text-stone-600 text-sm italic">No combatants in this encounter.</p>
            )}
          </div>
          <div className="h-40 shrink-0 border-t border-stone-700 bg-stone-900">
            <CombatLog entries={encounter.combat_log} />
          </div>
        </main>
      </div>

      {/* Log Entry Modal */}
      {pendingAction && activeCombatant && (
        <LogEntryModal
          actorId={pendingAction.combatantId}
          action={pendingAction.action}
          currentRound={encounter.current_round}
          allCombatants={encounter.combatants}
          onCommit={payload => {
            commitAction(payload);
            setPendingAction(null);
          }}
          onClose={() => setPendingAction(null)}
        />
      )}
    </div>
  );
}
