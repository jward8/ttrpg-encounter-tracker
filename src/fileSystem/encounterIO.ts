import { Encounter } from './schema'

export async function saveEncounter(
  encounter: Encounter,
  rootPath: string,
): Promise<void> {
  const dir = `${rootPath}/${encounter.campaign_id}/encounters`
  await window.electronAPI.ensureDir(dir)
  await window.electronAPI.writeFile(
    `${dir}/${encounter.id}.json`,
    JSON.stringify(encounter, null, 2),
  )
}

export async function loadEncounter(
  rootPath: string,
  campaignId: string,
  encounterId: string,
): Promise<Encounter> {
  const content = await window.electronAPI.readFile(
    `${rootPath}/${campaignId}/encounters/${encounterId}.json`,
  )
  return JSON.parse(content) as Encounter
}

export async function loadLatestEncounter(
  rootPath: string,
  campaignId: string,
): Promise<Encounter | null> {
  const dir = `${rootPath}/${campaignId}/encounters`
  const dirExists = await window.electronAPI.fileExists(dir)
  if (!dirExists) return null

  const files = await window.electronAPI.listFiles(dir)
  const jsonFiles = files.filter((f) => f.endsWith('.json'))

  let latest: Encounter | null = null
  for (const fileName of jsonFiles) {
    const content = await window.electronAPI.readFile(`${dir}/${fileName}`)
    const enc = JSON.parse(content) as Encounter
    if (!latest || enc.updated_at > latest.updated_at) latest = enc
  }
  return latest
}
