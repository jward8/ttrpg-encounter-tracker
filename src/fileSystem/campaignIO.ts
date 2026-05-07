import type { Campaign, PlayerCharacter } from './schema';

export function migratePlayerCharacter(raw: any): PlayerCharacter {
  const level = typeof raw.level === 'number' ? raw.level : 1;
  return {
    ...raw,
    current_hp: raw.current_hp ?? raw.max_hp,
    temp_hp: raw.temp_hp ?? 0,
    ability_scores: raw.ability_scores ?? {
      strength: 10, dexterity: 10, constitution: 10,
      intelligence: 10, wisdom: 10, charisma: 10,
    },
    save_proficiencies: raw.save_proficiencies ?? [],
    proficiency_bonus: raw.proficiency_bonus ?? Math.ceil(level / 4) + 1,
    passive_perception: raw.passive_perception ?? 10,
    resistances: raw.resistances ?? [],
    immunities: raw.immunities ?? [],
    vulnerabilities: raw.vulnerabilities ?? [],
    imported_from: raw.imported_from ?? 'manual',
  };
}

function migrateCampaign(raw: any): Campaign {
  return {
    ...raw,
    player_characters: (raw.player_characters ?? []).map(migratePlayerCharacter),
  };
}

export async function saveCampaign(
  campaign: Campaign,
  rootPath: string,
): Promise<void> {
  const dir = `${rootPath}/${campaign.id}`;
  await window.electronAPI.ensureDir(dir);
  await window.electronAPI.writeFile(
    `${dir}/campaign.json`,
    JSON.stringify(campaign, null, 2),
  );
}

export async function loadCampaign(
  rootPath: string,
  campaignId: string,
): Promise<Campaign | null> {
  const filePath = `${rootPath}/${campaignId}/campaign.json`;
  const exists = await window.electronAPI.fileExists(filePath);
  if (!exists) return null;
  const content = await window.electronAPI.readFile(filePath);
  return migrateCampaign(JSON.parse(content));
}
