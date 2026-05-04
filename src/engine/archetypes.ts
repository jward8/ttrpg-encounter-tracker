import { Archetype, Combatant } from '../fileSystem/schema';

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

export function suggestArchetype(combatant: Combatant): Archetype {
  if (combatant.legendary_actions_max > 0) return 'boss';
  if (combatant.current_hp > 100) return 'brute';

  const hasRangedOnly = combatant.actions.every(a => a.range_hint !== 'melee');
  if (hasRangedOnly && combatant.max_hp < 30) return 'glass_cannon';
  if (hasRangedOnly) return 'skirmisher';

  const hasAoe = combatant.actions.some(a => a.range_hint === 'area');
  if (hasAoe) return 'controller';

  return 'brute';
}
