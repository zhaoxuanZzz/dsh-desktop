import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  ApplyBrandError,
  applyOverlay,
  assertVendorClean,
  restoreOverlay,
  runWithBrandOverlay,
  type OverlayMap,
} from '../scripts/apply-brand.ts'

let dir = ''
afterEach(() => { if (dir !== '') rmSync(dir, { recursive: true, force: true }) })

function gitInit(): string {
  dir = mkdtempSync(join(tmpdir(), 'saddle-brand-'))
  execFileSync('git', ['init'], { cwd: dir })
  execFileSync('git', ['config', 'user.email', 't@t'], { cwd: dir })
  execFileSync('git', ['config', 'user.name', 't'], { cwd: dir })
  execFileSync('git', ['config', 'core.autocrlf', 'false'], { cwd: dir })
  mkdirSync(join(dir, 'packages'), { recursive: true })
  writeFileSync(join(dir, 'keep.txt'), 'orig\n')
  writeFileSync(join(dir, 'packages/base.css'), "@import 'a.css';\n")
  execFileSync('git', ['add', '.'], { cwd: dir })
  execFileSync('git', ['commit', '-m', 'i'], { cwd: dir })
  return dir
}

const map: OverlayMap = {
  replace: [{ from: 'brand/overlay/keep.txt', to: 'keep.txt' }],
  add: [{ from: 'brand/theme.css', to: 'packages/saddle-theme.css' }],
  patch: [{ to: 'packages/base.css', find: "@import 'a.css';", with: "@import 'a.css';\n@import 'saddle.css';" }],
}

describe('apply-brand', () => {
  it('replaces, adds, patches, then restore returns sources', () => {
    const vendor = gitInit()
    const repo = mkdtempSync(join(tmpdir(), 'saddle-repo-'))
    mkdirSync(join(repo, 'brand/overlay'), { recursive: true })
    writeFileSync(join(repo, 'brand/overlay/keep.txt'), 'branded\n')
    writeFileSync(join(repo, 'brand/theme.css'), 'body{}\n')
    applyOverlay({ repoRoot: repo, vendorRoot: vendor, map })
    expect(readFileSync(join(vendor, 'keep.txt'), 'utf8')).toBe('branded\n')
    expect(readFileSync(join(vendor, 'packages/saddle-theme.css'), 'utf8')).toBe('body{}\n')
    expect(readFileSync(join(vendor, 'packages/base.css'), 'utf8')).toContain("@import 'saddle.css';")
    restoreOverlay({ vendorRoot: vendor, map })
    expect(readFileSync(join(vendor, 'keep.txt'), 'utf8')).toBe('orig\n')
    expect(() => readFileSync(join(vendor, 'packages/saddle-theme.css'))).toThrow()
    expect(readFileSync(join(vendor, 'packages/base.css'), 'utf8')).toBe("@import 'a.css';\n")
    rmSync(repo, { recursive: true, force: true })
  })

  it('fails when find is missing and restores', () => {
    const vendor = gitInit()
    const repo = mkdtempSync(join(tmpdir(), 'saddle-repo-'))
    mkdirSync(join(repo, 'brand/overlay'), { recursive: true })
    writeFileSync(join(repo, 'brand/overlay/keep.txt'), 'branded\n')
    writeFileSync(join(repo, 'brand/theme.css'), 'body{}\n')
    const bad = { ...map, patch: [{ to: 'packages/base.css', find: 'NOPE', with: 'x' }] }
    expect(() => runWithBrandOverlay({ repoRoot: repo, vendorRoot: vendor, map: bad }, () => {})).toThrow(ApplyBrandError)
    expect(readFileSync(join(vendor, 'keep.txt'), 'utf8')).toBe('orig\n')
    rmSync(repo, { recursive: true, force: true })
  })

  it('fails when find occurs twice', () => {
    const vendor = gitInit()
    writeFileSync(join(vendor, 'packages/base.css'), "@import 'a.css';\n@import 'a.css';\n")
    execFileSync('git', ['add', 'packages/base.css'], { cwd: vendor })
    execFileSync('git', ['commit', '-m', 'dup'], { cwd: vendor })
    const repo = mkdtempSync(join(tmpdir(), 'saddle-repo-'))
    mkdirSync(join(repo, 'brand/overlay'), { recursive: true })
    writeFileSync(join(repo, 'brand/overlay/keep.txt'), 'branded\n')
    writeFileSync(join(repo, 'brand/theme.css'), 'body{}\n')
    expect(() => applyOverlay({ repoRoot: repo, vendorRoot: vendor, map })).toThrow(/exactly once/)
    rmSync(repo, { recursive: true, force: true })
  })

  it('rejects a dirty vendor tree', () => {
    const vendor = gitInit()
    writeFileSync(join(vendor, 'keep.txt'), 'dirty\n')
    expect(() => assertVendorClean(vendor)).toThrow(/dirty/)
  })

  it('runWithBrandOverlay restores when fn throws', () => {
    const vendor = gitInit()
    const repo = mkdtempSync(join(tmpdir(), 'saddle-repo-'))
    mkdirSync(join(repo, 'brand/overlay'), { recursive: true })
    writeFileSync(join(repo, 'brand/overlay/keep.txt'), 'branded\n')
    writeFileSync(join(repo, 'brand/theme.css'), 'body{}\n')
    expect(() => runWithBrandOverlay({ repoRoot: repo, vendorRoot: vendor, map }, () => {
      throw new Error('build failed')
    })).toThrow(/build failed/)
    expect(readFileSync(join(vendor, 'keep.txt'), 'utf8')).toBe('orig\n')
    rmSync(repo, { recursive: true, force: true })
  })
})
