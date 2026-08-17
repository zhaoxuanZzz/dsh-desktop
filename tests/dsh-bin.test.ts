import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { resolveDshBin } from '../scripts/dsh-bin.ts'

describe('resolveDshBin', () => {
  it('resolves bin.dsh relative to install root', () => {
    expect(resolveDshBin('/app/dsh', { bin: { dsh: 'lib/bin.js' } })).toBe(join('/app/dsh', 'lib/bin.js'))
  })

  it('rejects missing bin', () => {
    expect(() => resolveDshBin('/app/dsh', {})).toThrow(/bin.dsh/)
  })
})

describe('electron-builder extraResources', () => {
  it('does not copy dsh from a FileSet whose root is the install (drops node_modules)', () => {
    const yml = readFileSync(join(process.cwd(), 'electron-builder.yml'), 'utf8')
    expect(yml).not.toMatch(/from:\s*build\/dsh\b/)
    expect(yml).toMatch(/from:\s*build\n\s+to:\s*\./)
  })
})

describe('stage-dsh deploy', () => {
  it('injects workspace packages instead of --legacy', () => {
    const src = readFileSync(join(process.cwd(), 'scripts/stage-dsh.ts'), 'utf8')
    expect(src).not.toMatch(/'--legacy'/)
    expect(src).toMatch(/inject-workspace-packages=true/)
    expect(src).toMatch(/hoistMissingWorkspacePackages/)
  })
})
