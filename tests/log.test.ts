import { mkdtemp, readFile, readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { RotatingFileLog } from '../src/main/log.ts'

const dirs: string[] = []

afterEach(async () => {
  // leave temps; OS cleans. no unlink required
})

describe('RotatingFileLog', () => {
  it('writes lines without env dumps', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'saddle-log-'))
    dirs.push(dir)
    const log = new RotatingFileLog({ dir, basename: 'saddle', maxBytes: 1024, files: 3 })
    log.write('hello')
    await log.flush()
    const text = await readFile(join(dir, 'saddle.log'), 'utf8')
    expect(text).toContain('hello')
    expect(text).not.toContain('DSH_HOME')
  })

  it('rotates when over maxBytes', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'saddle-log-'))
    const log = new RotatingFileLog({ dir, basename: 'saddle', maxBytes: 32, files: 3 })
    for (let i = 0; i < 20; i += 1) log.write('xxxxxxxxxxxxxxxxxxxx')
    await log.flush()
    const names = await readdir(dir)
    expect(names.some(name => name.startsWith('saddle'))).toBe(true)
    expect(names.length).toBeGreaterThan(1)
  })
})
