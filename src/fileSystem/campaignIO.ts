import type { Campaign } from './schema';

export async function saveCampaign(
  campaign: Campaign,
  dirHandle: FileSystemDirectoryHandle,
): Promise<void> {
  const campaignDir = await dirHandle.getDirectoryHandle(campaign.id, { create: true });
  const fileHandle = await campaignDir.getFileHandle('campaign.json', { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(JSON.stringify(campaign, null, 2));
  await writable.close();
}

export async function loadCampaignFromDir(
  dirHandle: FileSystemDirectoryHandle,
  campaignId: string,
): Promise<Campaign | null> {
  try {
    const campaignDir = await dirHandle.getDirectoryHandle(campaignId);
    const fileHandle = await campaignDir.getFileHandle('campaign.json');
    const file = await fileHandle.getFile();
    const text = await file.text();
    return JSON.parse(text) as Campaign;
  } catch {
    return null;
  }
}
