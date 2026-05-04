import { Combatant, CombatantAction } from '../fileSystem/schema';
import { ARCHETYPES } from './archetypes';

export interface RecommendedAction {
  action: CombatantAction;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
}

export function getRecommendedActions(
  combatant: Combatant,
  _allCombatants: Combatant[]
): RecommendedAction[] {
  if (!combatant.archetype) return [];

  const archetype = ARCHETYPES[combatant.archetype];
  const available = [
    ...combatant.actions,
    ...combatant.bonus_actions,
  ].filter(a => a.available);

  const recommendations: RecommendedAction[] = [];

  for (const action of available) {
    if (matchesArchetypePriority(action, archetype.priority)) {
      recommendations.push({
        action,
        reason: getRangeReason(action),
        confidence: 'high',
      });
    }
  }

  return recommendations;
}

export function getRangeReason(action: CombatantAction): string {
  switch (action.range_hint) {
    case 'melee': return 'Recommended at melee';
    case 'ranged_30': return 'Recommended within 30 ft';
    case 'ranged_60': return 'Recommended within 60 ft';
    case 'ranged_120': return 'Recommended within 120 ft';
    case 'area': return 'Recommended vs. clustered targets';
    default: return 'Recommended';
  }
}

export function matchesArchetypePriority(
  action: CombatantAction,
  priorities: readonly string[]
): boolean {
  if (priorities.includes('highest_damage_action') && action.damage) return true;
  if (priorities.includes('melee_attack') && action.range_hint === 'melee') return true;
  if (priorities.includes('ranged_attack') && action.range_hint !== 'melee') return true;
  if (priorities.includes('aoe_control') && action.range_hint === 'area') return true;
  if (priorities.includes('legendary_action') && action.action_category === 'legendary') return true;
  return false;
}
