import { vi, describe, it, expect, beforeEach } from 'vitest'
import * as fs from 'fs/promises'

vi.mock('fs/promises')

import {
  readFile,
  writeFile,
  ensureDir,
  listFiles,
  fileExists,
} from '../fileHandlers'

beforeEach(() => {
  vi.resetAllMocks()
})

describe('readFile', () => {
  it('reads file content as a utf-8 string', async () => {
    vi.mocked(fs.readFile).mockResolvedValue('{"id":"abc"}' as never)
    const result = await readFile('/campaigns/abc/encounters/enc.json')
    expect(result).toBe('{"id":"abc"}')
    expect(fs.readFile).toHaveBeenCalledWith(
      '/campaigns/abc/encounters/enc.json',
      'utf-8',
    )
  })
})

describe('writeFile', () => {
  it('writes content as utf-8 to the given path', async () => {
    vi.mocked(fs.writeFile).mockResolvedValue(undefined)
    await writeFile('/campaigns/abc/encounters/enc.json', '{"id":"abc"}')
    expect(fs.writeFile).toHaveBeenCalledWith(
      '/campaigns/abc/encounters/enc.json',
      '{"id":"abc"}',
      'utf-8',
    )
  })
})

describe('ensureDir', () => {
  it('creates the directory recursively', async () => {
    vi.mocked(fs.mkdir).mockResolvedValue(undefined)
    await ensureDir('/campaigns/abc/encounters')
    expect(fs.mkdir).toHaveBeenCalledWith('/campaigns/abc/encounters', {
      recursive: true,
    })
  })
})

describe('listFiles', () => {
  it('returns file names in the directory', async () => {
    vi.mocked(fs.readdir).mockResolvedValue([
      'enc1.json',
      'enc2.json',
    ] as never)
    const result = await listFiles('/campaigns/abc/encounters')
    expect(result).toEqual(['enc1.json', 'enc2.json'])
  })

  it('returns an empty array if the directory does not exist', async () => {
    vi.mocked(fs.readdir).mockRejectedValue(new Error('ENOENT'))
    const result = await listFiles('/nonexistent')
    expect(result).toEqual([])
  })
})

describe('fileExists', () => {
  it('returns true when the file is accessible', async () => {
    vi.mocked(fs.access).mockResolvedValue(undefined)
    const result = await fileExists('/campaigns/abc/campaign.json')
    expect(result).toBe(true)
  })

  it('returns false when the file is not accessible', async () => {
    vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT'))
    const result = await fileExists('/nonexistent.json')
    expect(result).toBe(false)
  })
})
