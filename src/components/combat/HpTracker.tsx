import { useState } from 'react';
import type { DamageType } from '../../fileSystem/schema';

const ALL_DAMAGE_TYPES: DamageType[] = [
  'acid', 'bludgeoning', 'cold', 'fire', 'force',
  'lightning', 'necrotic', 'piercing', 'poison',
  'psychic', 'radiant', 'slashing', 'thunder',
];

interface HpTrackerProps {
  currentHp: number;
  maxHp: number;
  tempHp: number;
  onDamage?: (amount: number, damageType: DamageType) => void;
  onHeal?: (amount: number) => void;
  onSetTempHp?: (amount: number) => void;
}

function hpBarColor(current: number, max: number): string {
  const pct = max > 0 ? current / max : 0;
  if (pct <= 0.25) return 'bg-red-600';
  if (pct <= 0.5) return 'bg-yellow-500';
  return 'bg-emerald-500';
}

export default function HpTracker({ currentHp, maxHp, tempHp, onDamage, onHeal, onSetTempHp }: HpTrackerProps) {
  const [damageInput, setDamageInput] = useState('');
  const [healInput, setHealInput] = useState('');
  const [tempInput, setTempInput] = useState('');
  const [dmgType, setDmgType] = useState<DamageType>('bludgeoning');

  const hpPct = maxHp > 0 ? Math.round((currentHp / maxHp) * 100) : 0;
  const isInteractive = !!(onDamage || onHeal || onSetTempHp);

  function handleDamage() {
    const n = parseInt(damageInput, 10);
    if (!isNaN(n) && n > 0 && onDamage) {
      onDamage(n, dmgType);
      setDamageInput('');
    }
  }

  function handleHeal() {
    const n = parseInt(healInput, 10);
    if (!isNaN(n) && n > 0 && onHeal) {
      onHeal(n);
      setHealInput('');
    }
  }

  function handleSetTemp() {
    const n = parseInt(tempInput, 10);
    if (!isNaN(n) && n >= 0 && onSetTempHp) {
      onSetTempHp(n);
      setTempInput('');
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-1.5">
        <span className="text-xs text-stone-400 uppercase tracking-wider">HP</span>
        <span className="text-2xl font-bold text-stone-100">{currentHp}</span>
        <span className="text-stone-400 text-lg">/ {maxHp}</span>
        {tempHp > 0 && (
          <span className="text-sm text-sky-400 ml-1">+{tempHp} tmp</span>
        )}
      </div>

      <div className="h-2.5 rounded-full bg-stone-700 overflow-hidden">
        <div
          className={`h-full rounded-full ${hpBarColor(currentHp, maxHp)}`}
          style={{ width: `${hpPct}%` }}
        />
      </div>

      {isInteractive && (
        <div className="flex flex-col gap-2 pt-1">
          {onDamage && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <input
                type="number"
                min="0"
                placeholder="0"
                value={damageInput}
                onChange={e => setDamageInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleDamage()}
                className="w-16 bg-stone-700 border border-stone-600 rounded px-2 py-1 text-center text-sm text-stone-100 focus:outline-none focus:border-stone-400"
              />
              <select
                value={dmgType}
                onChange={e => setDmgType(e.target.value as DamageType)}
                className="bg-stone-700 border border-stone-600 rounded px-2 py-1 text-xs text-stone-200 focus:outline-none focus:border-stone-400"
              >
                {ALL_DAMAGE_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <button
                onClick={handleDamage}
                className="bg-red-800 hover:bg-red-700 text-white text-xs px-2.5 py-1.5 rounded transition-colors"
              >
                Dmg
              </button>
            </div>
          )}
          {onHeal && (
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="0"
                placeholder="0"
                value={healInput}
                onChange={e => setHealInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleHeal()}
                className="w-16 bg-stone-700 border border-stone-600 rounded px-2 py-1 text-center text-sm text-stone-100 focus:outline-none focus:border-stone-400"
              />
              <button
                onClick={handleHeal}
                className="bg-emerald-800 hover:bg-emerald-700 text-white text-xs px-2.5 py-1.5 rounded transition-colors"
              >
                Heal
              </button>
            </div>
          )}
          {onSetTempHp && (
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="0"
                placeholder="0"
                value={tempInput}
                onChange={e => setTempInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSetTemp()}
                className="w-16 bg-stone-700 border border-stone-600 rounded px-2 py-1 text-center text-sm text-stone-100 focus:outline-none focus:border-stone-400"
              />
              <button
                onClick={handleSetTemp}
                className="bg-sky-800 hover:bg-sky-700 text-white text-xs px-2.5 py-1.5 rounded transition-colors"
              >
                THP
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
