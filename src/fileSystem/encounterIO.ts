import { Encounter } from './schema';

export async function loadLatestEncounter(
  dirHandle: FileSystemDirectoryHandle,
  campaignId: string,
): Promise<Encounter | null> {
  try {
    const campaignDir = await dirHandle.getDirectoryHandle(campaignId);
    const encounterDir = await campaignDir.getDirectoryHandle('encounters');
    let latest: Encounter | null = null;
    for await (const entry of encounterDir.values()) {
      if (entry.kind !== 'file' || !entry.name.endsWith('.json')) continue;
      const file = await (entry as FileSystemFileHandle).getFile();
      const text = await file.text();
      const enc = JSON.parse(text) as Encounter;
      if (!latest || enc.updated_at > latest.updated_at) latest = enc;
    }
    return latest;
  } catch {
    return null;
  }
}

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
