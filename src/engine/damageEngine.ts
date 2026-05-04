import { Combatant, DamageType } from '../fileSystem/schema';

export interface DamageResult {
  finalAmount: number;
  newHp: number;
  newTempHp: number;
  note: string;
}

export function applyDamage(
  combatant: Combatant,
  rawAmount: number,
  damageType: DamageType
): DamageResult {
  if (combatant.immunities.includes(damageType)) {
    return {
      finalAmount: 0,
      newHp: combatant.current_hp,
      newTempHp: combatant.temp_hp,
      note: 'Immune',
    };
  }

  let amount = rawAmount;
  let note = '';

  if (combatant.resistances.includes(damageType)) {
    amount = Math.floor(amount / 2);
    note = 'Resisted (half damage)';
  } else if (combatant.vulnerabilities.includes(damageType)) {
    amount = amount * 2;
    note = 'Vulnerable (double damage)';
  }

  let newTempHp = combatant.temp_hp;
  let remaining = amount;

  if (newTempHp > 0) {
    const absorbed = Math.min(newTempHp, remaining);
    newTempHp -= absorbed;
    remaining -= absorbed;
  }

  const newHp = Math.max(0, combatant.current_hp - remaining);

  return { finalAmount: rawAmount, newHp, newTempHp, note };
}
