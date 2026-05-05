import { useEffect, useRef, useState } from 'react';
import { useEncounterStore } from './store/encounterStore';
import { useCampaignStore } from './store/campaignStore';
import { saveEncounter } from './fileSystem/encounterIO';
import type { CombatantAction, DamageType } from './fileSystem/schema';
import InitiativeList from './components/combat/InitiativeList';
import ActionPanel from './components/combat/ActionPanel';
import CombatLog from './components/combat/CombatLog';
import LogEntryModal from './components/combat/LogEntryModal';
import EncounterSetup from './components/encounter/EncounterSetup';
import InitiativeInput from './components/encounter/InitiativeInput';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function App() {
  const encounter = useEncounterStore(s => s.encounter);
  const past = useEncounterStore(s => s.past);
  const dirHandle = useEncounterStore(s => s.dirHandle);
  const recommendedActionIds = useEncounterStore(s => s.recommendedActionIds);

  const campaign = useCampaignStore(s => s.campaign);

  const advanceTurn = useEncounterStore(s => s.advanceTurn);
  const undoLastAction = useEncounterStore(s => s.undoLastAction);
  const openDirectory = useEncounterStore(s => s.openDirectory);
  const updateEncounterMeta = useEncounterStore(s => s.updateEncounterMeta);
  const applyDamage = useEncounterStore(s => s.applyDamage);
  const healCombatant = useEncounterStore(s => s.healCombatant);
  const setTempHp = useEncounterStore(s => s.setTempHp);
  const useReaction = useEncounterStore(s => s.useReaction);
  const applyCondition = useEncounterStore(s => s.applyCondition);
  const removeCondition = useEncounterStore(s => s.removeCondition);
  const commitAction = useEncounterStore(s => s.commitAction);

  const createCampaign = useCampaignStore(s => s.createCampaign);

  const [selectedCombatantId, setSelectedCombatantId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{ combatantId: string; action: CombatantAction } | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [campaignNameInput, setCampaignNameInput] = useState('');

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const campaignSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-save encounter on every mutation when a directory is open
  useEffect(() => {
    const unsub = useEncounterStore.subscribe(
      s => s.encounter,
      enc => {
        const { dirHandle: dh } = useEncounterStore.getState();
        if (!dh || !enc.campaign_id) return;
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

  // Auto-save campaign on every mutation when a directory is open
  useEffect(() => {
    const unsub = useCampaignStore.subscribe(
      s => s.campaign,
      camp => {
        const dh = useEncounterStore.getState().dirHandle;
        if (!camp || !dh) return;
        if (campaignSaveTimeoutRef.current) clearTimeout(campaignSaveTimeoutRef.current);
        campaignSaveTimeoutRef.current = setTimeout(async () => {
          const currentDh = useEncounterStore.getState().dirHandle;
          if (!currentDh) return;
          try {
            await useCampaignStore.getState().saveCampaign(currentDh);
          } catch {}
        }, 500);
      },
    );
    return () => {
      unsub();
      if (campaignSaveTimeoutRef.current) clearTimeout(campaignSaveTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!dirHandle) setSaveStatus('idle');
  }, [dirHandle]);

  const isActiveCombat = encounter.status === 'active' || encounter.status === 'paused';

  const activeCombatant = encounter.combatants[encounter.current_turn_index] ?? null;
  const selectedCombatant = selectedCombatantId
    ? (encounter.combatants.find(c => c.id === selectedCombatantId) ?? null)
    : null;
  const isViewingActive = !selectedCombatant || selectedCombatant.id === activeCombatant?.id;
  const displayCombatant = isViewingActive ? activeCombatant : selectedCombatant;

  function handleSelectCombatant(id: string) {
    setSelectedCombatantId(prev => (prev === id ? null : id));
  }

  async function handleOpenFolder() {
    try {
      await openDirectory();
    } catch {}
  }

  async function handleCreateNew() {
    const name = campaignNameInput.trim();
    if (!name) return;
    createCampaign(name);
    try {
      await openDirectory();
      const dh = useEncounterStore.getState().dirHandle;
      if (dh) await useCampaignStore.getState().saveCampaign(dh);
    } catch {}
    setCampaignNameInput('');
  }

  async function handleCreateCampaign() {
    const name = campaignNameInput.trim();
    if (!name) return;
    createCampaign(name);
    const newCampaign = useCampaignStore.getState().campaign!;
    updateEncounterMeta(encounter.name, newCampaign.id, encounter.tactics_enabled);
    if (dirHandle) await useCampaignStore.getState().saveCampaign(dirHandle);
    setCampaignNameInput('');
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

  const inputCls = 'bg-stone-800 border border-stone-600 rounded px-2 py-1 text-sm text-stone-100 focus:outline-none focus:border-amber-500';

  return (
    <div className="h-screen bg-stone-950 text-stone-100 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-12 bg-stone-900 border-b border-stone-700 flex items-center px-4 gap-3 shrink-0">
        <h1 className="text-sm font-semibold uppercase tracking-widest text-amber-400">
          {isActiveCombat ? encounter.name : 'TTRPG Tracker'}
        </h1>
        {isActiveCombat && (
          <span className="text-stone-500 text-sm">Round {encounter.current_round}</span>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <span className={`text-[10px] uppercase tracking-wider ${saveLabelColor}`}>
            {saveLabel}
          </span>
          {isActiveCombat && (
            <>
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
            </>
          )}
        </div>
      </header>

      {/* Body routing */}
      {!dirHandle ? (
        /* Landing — no folder open */
        <div className="flex-1 flex flex-col items-center justify-center gap-8 p-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold text-stone-100">TTRPG Encounter Tracker</h2>
            <p className="text-stone-500 text-sm">Open an existing campaign folder or start a new one.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 w-full max-w-lg">
            {/* Open existing */}
            <div className="flex-1 bg-stone-900 border border-stone-700 rounded-lg p-5 flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-stone-200">Open Existing</h3>
              <p className="text-xs text-stone-500 flex-1">Resume a campaign from a folder on your device.</p>
              <button
                onClick={handleOpenFolder}
                className="w-full text-sm px-4 py-2 rounded border border-stone-600 text-stone-300 hover:text-stone-100 hover:border-stone-400 transition-colors"
              >
                Open Folder
              </button>
            </div>

            {/* Create new */}
            <div className="flex-1 bg-stone-900 border border-stone-700 rounded-lg p-5 flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-stone-200">Create New</h3>
              <input
                className={`${inputCls} w-full`}
                placeholder="Campaign name"
                value={campaignNameInput}
                onChange={e => setCampaignNameInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCreateNew(); }}
              />
              <button
                onClick={handleCreateNew}
                disabled={campaignNameInput.trim() === ''}
                className="w-full text-sm px-4 py-2 rounded bg-amber-600 hover:bg-amber-500 text-white font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Create &amp; Choose Folder
              </button>
            </div>
          </div>
        </div>
      ) : !campaign ? (
        /* Folder open but no campaign.json found */
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
          <div className="text-center space-y-1">
            <h2 className="text-lg font-semibold text-stone-100">Name Your Campaign</h2>
            <p className="text-stone-500 text-xs">No campaign found in that folder. Create one to continue.</p>
          </div>
          <div className="flex gap-2 w-full max-w-sm">
            <input
              className={`${inputCls} flex-1`}
              placeholder="Campaign name"
              value={campaignNameInput}
              onChange={e => setCampaignNameInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreateCampaign(); }}
              autoFocus
            />
            <button
              onClick={handleCreateCampaign}
              disabled={campaignNameInput.trim() === ''}
              className="text-sm px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Create
            </button>
          </div>
        </div>
      ) : encounter.status === 'setup' ? (
        <EncounterSetup />
      ) : encounter.status === 'initiative' ? (
        <InitiativeInput />
      ) : (
        /* Combat tracker */
        <>
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
        </>
      )}
    </div>
  );
}
