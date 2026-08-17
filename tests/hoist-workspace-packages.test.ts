import { describe, expect, it } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, readFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { hoistMissingWorkspacePackages } from '../scripts/hoist-workspace-packages.ts'

function tmp(): string {
  return mkdtempSync(join(tmpdir(), 'saddle-hoist-'))
}

describe('hoistMissingWorkspacePackages', () => {
  it('copies a missing workspace package and skips one already present', () => {
    const vendor = tmp()
    const dest = tmp()
    mkdirSync(join(vendor, 'packages/scope/lib'), { recursive: true })
    writeFileSync(join(vendor, 'packages/scope/package.json'), JSON.stringify({ name: '@deepseek-ai/dsh-scope' }))
    writeFileSync(join(vendor, 'packages/scope/lib/index.js'), 'export {}\n')
    mkdirSync(join(vendor, 'packages/timeout/lib'), { recursive: true })
    writeFileSync(join(vendor, 'packages/timeout/package.json'), JSON.stringify({ name: '@deepseek-ai/dsh-timeout' }))
    writeFileSync(join(vendor, 'packages/timeout/lib/index.js'), 'export {}\n')
    mkdirSync(join(dest, 'node_modules/@deepseek-ai/dsh-timeout'), { recursive: true })
    writeFileSync(join(dest, 'node_modules/@deepseek-ai/dsh-timeout/package.json'), JSON.stringify({ name: '@deepseek-ai/dsh-timeout', kept: true }))

    const copied = hoistMissingWorkspacePackages(vendor, dest)
    expect(copied).toEqual(['@deepseek-ai/dsh-scope'])
    expect(readFileSync(join(dest, 'node_modules/@deepseek-ai/dsh-scope/lib/index.js'), 'utf8')).toBe('export {}\n')
    expect(JSON.parse(readFileSync(join(dest, 'node_modules/@deepseek-ai/dsh-timeout/package.json'), 'utf8')).kept).toBe(true)
  })

  it('replaces a dangling symlink', () => {
    const vendor = tmp()
    const dest = tmp()
    mkdirSync(join(vendor, 'vendor/group/lib'), { recursive: true })
    writeFileSync(join(vendor, 'vendor/group/package.json'), JSON.stringify({ name: '@deepseek-ai/cordis-plugin-group' }))
    writeFileSync(join(vendor, 'vendor/group/lib/index.js'), 'export {}\n')
    const target = join(dest, 'node_modules/@deepseek-ai/cordis-plugin-group')
    mkdirSync(join(dest, 'node_modules/@deepseek-ai'), { recursive: true })
    symlinkSync('/no/such/group', target)

    hoistMissingWorkspacePackages(vendor, dest)
    expect(existsSync(join(target, 'lib/index.js'))).toBe(true)
  })
})
