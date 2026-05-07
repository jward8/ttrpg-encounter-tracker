import { useState } from 'react'
import type { Encounter } from '../fileSystem/schema'
import type { Campaign } from '../fileSystem/schema'
import {
  saveEncounter as saveEncounterIO,
  loadEncounter as loadEncounterIO,
  loadLatestEncounter as loadLatestEncounterIO,
} from '../fileSystem/encounterIO'
import {
  saveCampaign as saveCampaignIO,
  loadCampaign as loadCampaignIO,
} from '../fileSystem/campaignIO'

const ROOT_PATH_KEY = 'ttrpg-root-path'

export function useFileSystem() {
  const [rootPath, setRootPath] = useState<string | null>(
    () => localStorage.getItem(ROOT_PATH_KEY),
  )

  async function openDirectory(): Promise<void> {
    const selected = await window.electronAPI.selectFolder()
    if (selected) {
      localStorage.setItem(ROOT_PATH_KEY, selected)
      setRootPath(selected)
    }
  }

  async function saveEncounter(encounter: Encounter): Promise<void> {
    if (!rootPath) throw new Error('No directory selected. Call openDirectory() first.')
    await saveEncounterIO(encounter, rootPath)
  }

  async function loadEncounter(
    campaignId: string,
    encounterId: string,
  ): Promise<Encounter> {
    if (!rootPath) throw new Error('No directory selected. Call openDirectory() first.')
    return loadEncounterIO(rootPath, campaignId, encounterId)
  }

  async function loadLatestEncounter(
    campaignId: string,
  ): Promise<Encounter | null> {
    if (!rootPath) return null
    return loadLatestEncounterIO(rootPath, campaignId)
  }

  async function saveCampaign(campaign: Campaign): Promise<void> {
    if (!rootPath) throw new Error('No directory selected. Call openDirectory() first.')
    await saveCampaignIO(campaign, rootPath)
  }

  async function loadCampaign(campaignId: string): Promise<Campaign | null> {
    if (!rootPath) return null
    return loadCampaignIO(rootPath, campaignId)
  }

  return {
    rootPath,
    openDirectory,
    saveEncounter,
    loadEncounter,
    loadLatestEncounter,
    saveCampaign,
    loadCampaign,
  }
}
