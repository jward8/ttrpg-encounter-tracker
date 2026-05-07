import { useEncounterStore } from '../../store/encounterStore';
import { useUiStore } from '../../store/uiStore';

export default function ActiveEncounterCard() {
  const encounter = useEncounterStore(s => s.encounter);
  const goToEncounter = useUiStore(s => s.goToEncounter);

  const inProgress =
    encounter.status === 'initiative' ||
    encounter.status === 'active' ||
    encounter.status === 'paused';

  return (
    <section className="bg-stone-900 border border-stone-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-stone-200">Encounter</h3>
      </div>
      {inProgress ? (
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="text-stone-100 text-sm font-medium">{encounter.name}</div>
            <div className="text-stone-500 text-xs">
              {encounter.status} · Round {encounter.current_round}
            </div>
          </div>
          <button
            onClick={goToEncounter}
            className="text-sm px-4 py-2 rounded bg-amber-600 hover:bg-amber-500 text-white font-semibold transition-colors"
          >
            Continue
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="flex-1 text-stone-500 text-xs italic">
            No encounter in progress.
          </div>
          <button
            onClick={goToEncounter}
            className="text-sm px-4 py-2 rounded bg-amber-600 hover:bg-amber-500 text-white font-semibold transition-colors"
          >
            New Encounter
          </button>
        </div>
      )}
    </section>
  );
}
