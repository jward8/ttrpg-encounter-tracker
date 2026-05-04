export type CombatantType = 'player_character' | 'allied_npc' | 'enemy_npc';

export type ActionCategory = 'action' | 'bonus_action' | 'reaction' | 'legendary' | 'lair' | 'free';

export type DamageType =
  | 'acid' | 'bludgeoning' | 'cold' | 'fire' | 'force'
  | 'lightning' | 'necrotic' | 'piercing' | 'poison'
  | 'psychic' | 'radiant' | 'slashing' | 'thunder';

export type SrdCondition =
  | 'blinded' | 'charmed' | 'deafened' | 'exhaustion'
  | 'frightened' | 'grappled' | 'incapacitated' | 'invisible'
  | 'paralyzed' | 'petrified' | 'poisoned' | 'prone'
  | 'restrained' | 'stunned' | 'unconscious';

export type Archetype =
  | 'glass_cannon' | 'brute' | 'skirmisher' | 'protector'
  | 'controller' | 'support' | 'boss' | 'survivor' | null;

export type RangeHint =
  | 'melee' | 'ranged_30' | 'ranged_60' | 'ranged_120'
  | 'self' | 'touch' | 'area' | 'any';

export interface CombatantAction {
  id: string;
  name: string;
  action_category: ActionCategory;
  description?: string;
  attack_bonus?: number;
  damage?: string;
  damage_type?: DamageType;
  range_hint: RangeHint;
  save_dc?: number;
  save_ability?: string;
  recharge?: string;
  uses_max?: number;
  uses_remaining?: number;
  spell_slot_level?: number;
  available: boolean;
}

export interface SpellSlots {
  [level: number]: {
    max: number;
    remaining: number;
  };
}

export interface ConditionInstance {
  condition: SrdCondition | string;
  source?: string;
  duration_rounds?: number;
  save_to_end?: boolean;
}

export interface Combatant {
  id: string;
  name: string;
  type: CombatantType;
  ac: number;
  max_hp: number;
  current_hp: number;
  temp_hp: number;
  speed: number;
  initiative: number | null;
  initiative_modifier: number;
  conditions: ConditionInstance[];
  actions: CombatantAction[];
  bonus_actions: CombatantAction[];
  reactions: CombatantAction[];
  spell_slots: SpellSlots;
  resistances: DamageType[];
  immunities: DamageType[];
  vulnerabilities: DamageType[];
  legendary_actions_max: number;
  legendary_actions_remaining: number;
  legendary_actions?: CombatantAction[];
  archetype: Archetype;
  source_document?: string;
  notes: string;
}

export interface CombatLogEntry {
  id: string;
  round: number;
  combatant_id: string;
  combatant_name: string;
  action_id?: string;
  action_name: string;
  action_category: ActionCategory;
  target_ids: string[];
  target_names: string[];
  roll_to_hit?: number;
  hit?: boolean;
  damage_amount?: number;
  damage_type?: DamageType;
  was_resisted?: boolean;
  was_doubled?: boolean;
  conditions_applied?: string[];
  resource_consumed?: string;
  notes?: string;
  timestamp: string;
}

export type EncounterStatus = 'setup' | 'initiative' | 'active' | 'paused' | 'done';

export interface Encounter {
  id: string;
  campaign_id: string;
  name: string;
  status: EncounterStatus;
  tactics_enabled: boolean;
  current_round: number;
  current_turn_index: number;
  combatants: Combatant[];
  combat_log: CombatLogEntry[];
  created_at: string;
  updated_at: string;
}

export interface PlayerCharacter {
  id: string;
  name: string;
  player_name: string;
  classes: string[];
  level: number;
  ac: number;
  max_hp: number;
  initiative_modifier: number;
  speed: number;
  spell_slots: SpellSlots;
  actions: CombatantAction[];
  bonus_actions: CombatantAction[];
  reactions: CombatantAction[];
  notes: string;
}

export interface Campaign {
  id: string;
  name: string;
  player_characters: PlayerCharacter[];
  created_at: string;
  updated_at: string;
}
