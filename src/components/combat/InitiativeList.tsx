import type { Combatant } from '../../fileSystem/schema';
import CombatantCard from './CombatantCard';

interface InitiativeListProps {
  combatants: Combatant[];
  currentTurnIndex: number;
}

export default function InitiativeList({ combatants, currentTurnIndex }: InitiativeListProps) {
  const nextTurnIndex = (currentTurnIndex + 1) % combatants.length;

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 bg-stone-900 border-b border-stone-700 px-3 py-2 z-10 flex items-center justify-between shrink-0">
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
          Initiative Order
        </span>
      </div>
      <ol className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
        {combatants.map((combatant, index) => (
          <li key={combatant.id}>
            <CombatantCard
              combatant={combatant}
              isCurrentTurn={index === currentTurnIndex}
              isNextTurn={index === nextTurnIndex}
              isSelected={false}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}
