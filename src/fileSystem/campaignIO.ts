import type { Campaign } from './schema'

export async function saveCampaign(
  campaign: Campaign,
  rootPath: string,
): Promise<void> {
  const dir = `${rootPath}/${campaign.id}`
  await window.electronAPI.ensureDir(dir)
  await window.electronAPI.writeFile(
    `${dir}/campaign.json`,
    JSON.stringify(campaign, null, 2),
  )
}

export async function loadCampaign(
  rootPath: string,
  campaignId: string,
): Promise<Campaign | null> {
  const filePath = `${rootPath}/${campaignId}/campaign.json`
  const exists = await window.electronAPI.fileExists(filePath)
  if (!exists) return null
  const content = await window.electronAPI.readFile(filePath)
  return JSON.parse(content) as Campaign
}
