import { Encounter } from './schema';

export async function saveEncounter(
  encounter: Encounter,
  dirHandle: FileSystemDirectoryHandle
): Promise<void> {
  const campaignDir = await dirHandle.getDirectoryHandle(encounter.campaign_id, { create: true });
  const encounterDir = await campaignDir.getDirectoryHandle('encounters', { create: true });
  const fileHandle = await encounterDir.getFileHandle(`${encounter.id}.json`, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(JSON.stringify(encounter, null, 2));
  await writable.close();
}

export async function loadEncounter(fileHandle: FileSystemFileHandle): Promise<Encounter> {
  const file = await fileHandle.getFile();
  const text = await file.text();
  return JSON.parse(text) as Encounter;
}
