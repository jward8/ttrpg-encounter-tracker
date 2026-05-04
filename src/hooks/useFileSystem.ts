import { useState } from 'react';

declare global {
  interface Window {
    showDirectoryPicker(): Promise<FileSystemDirectoryHandle>;
  }
}
import { Encounter } from '../fileSystem/schema';
import { saveEncounter as saveEncounterIO, loadEncounter as loadEncounterIO } from '../fileSystem/encounterIO';

export function useFileSystem() {
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null);

  async function openDirectory(): Promise<void> {
    const handle = await window.showDirectoryPicker();
    setDirHandle(handle);
  }

  async function saveEncounter(encounter: Encounter): Promise<void> {
    if (!dirHandle) throw new Error('No directory selected. Call openDirectory() first.');
    await saveEncounterIO(encounter, dirHandle);
  }

  async function loadEncounter(fileHandle: FileSystemFileHandle): Promise<Encounter> {
    return loadEncounterIO(fileHandle);
  }

  return { dirHandle, openDirectory, saveEncounter, loadEncounter };
}
