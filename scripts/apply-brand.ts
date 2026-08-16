import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { execFileSync } from 'node:child_process'

export interface OverlayReplace { from: string; to: string }
export interface OverlayAdd { from: string; to: string }
export interface OverlayPatch { to: string; find: string; with: string }
export interface OverlayMap {
  replace: OverlayReplace[]
  add: OverlayAdd[]
  patch: OverlayPatch[]
}
export type GitFn = (args: string[], cwd: string) => void

export class ApplyBrandError extends Error {
  constructor(message: string, readonly overlayPath?: string) {
    super(message)
  }
}

export function loadOverlayMap(repoRoot: string): OverlayMap {
  const raw = JSON.parse(readFileSync(join(repoRoot, 'brand/overlay-map.json'), 'utf8')) as OverlayMap
  if (!Array.isArray(raw.replace) || !Array.isArray(raw.add) || !Array.isArray(raw.patch)) {
    throw new ApplyBrandError('overlay-map.json must have replace, add, and patch arrays')
  }
  return raw
}

function defaultGit(args: string[], cwd: string): void {
  execFileSync('git', args, { cwd, stdio: 'pipe' })
}

export function assertVendorClean(vendorRoot: string, git: GitFn = defaultGit): void {
  const porcelain = execFileSync('git', ['status', '--porcelain'], { cwd: vendorRoot, encoding: 'utf8' })
  if (porcelain.trim() !== '') {
    throw new ApplyBrandError('vendor working tree is dirty; commit or stash before apply-brand')
  }
  void git
}

export function applyOverlay(opts: { repoRoot: string; vendorRoot: string; map: OverlayMap }): void {
  const { repoRoot, vendorRoot, map } = opts
  for (const row of map.replace) {
    const dest = join(vendorRoot, row.to)
    if (!existsSync(dest)) throw new ApplyBrandError(`replace target missing: ${row.to}`, row.to)
    copyFileSync(join(repoRoot, row.from), dest)
  }
  for (const row of map.add) {
    const dest = join(vendorRoot, row.to)
    mkdirSync(dirname(dest), { recursive: true })
    copyFileSync(join(repoRoot, row.from), dest)
  }
  for (const row of map.patch) {
    const dest = join(vendorRoot, row.to)
    if (!existsSync(dest)) throw new ApplyBrandError(`patch target missing: ${row.to}`, row.to)
    const src = readFileSync(dest, 'utf8')
    const n = src.split(row.find).length - 1
    if (n !== 1) {
      throw new ApplyBrandError(
        `patch find must occur exactly once in ${row.to} (found ${String(n)}): ${row.find.slice(0, 80)}`,
        row.to,
      )
    }
    writeFileSync(dest, src.replace(row.find, row.with))
  }
}

export function restoreOverlay(opts: { vendorRoot: string; map: OverlayMap; git?: GitFn }): void {
  const git = opts.git ?? defaultGit
  const tracked = [...new Set([...opts.map.replace, ...opts.map.patch].map(row => row.to))]
  try {
    if (tracked.length > 0) git(['checkout', '--', ...tracked], opts.vendorRoot)
    for (const row of opts.map.add) git(['clean', '-f', '--', row.to], opts.vendorRoot)
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    throw new ApplyBrandError(`vendor 源文件可能仍带品牌，需手动 git checkout: ${detail}`)
  }
}

export function runWithBrandOverlay(
  opts: { repoRoot: string; vendorRoot: string; map: OverlayMap },
  fn: () => void,
): void {
  assertVendorClean(opts.vendorRoot)
  let fnError: unknown
  try {
    applyOverlay(opts)
    fn()
  } catch (error) {
    fnError = error
  } finally {
    try {
      restoreOverlay({ vendorRoot: opts.vendorRoot, map: opts.map })
    } catch (restoreError) {
      const restoreMsg = restoreError instanceof Error ? restoreError.message : String(restoreError)
      if (fnError !== undefined) {
        const fnMsg = fnError instanceof Error ? fnError.message : String(fnError)
        throw new ApplyBrandError(`vendor 源文件可能仍带品牌，需手动 git checkout (${restoreMsg}); prior: ${fnMsg}`)
      }
      throw restoreError
    }
  }
  if (fnError !== undefined) throw fnError
}

function main(): void {
  const cmd = process.argv[2]
  const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
  const vendorRoot = join(repoRoot, 'vendor', 'deepseek-harness')
  if (!existsSync(join(vendorRoot, '.git'))) throw new ApplyBrandError('missing vendor/deepseek-harness')
  const map = loadOverlayMap(repoRoot)
  if (cmd === 'restore') {
    restoreOverlay({ vendorRoot, map })
    return
  }
  if (cmd === 'apply') {
    assertVendorClean(vendorRoot)
    try {
      applyOverlay({ repoRoot, vendorRoot, map })
    } catch (error) {
      try { restoreOverlay({ vendorRoot, map }) } catch { /* keep original */ }
      throw error
    }
    return
  }
  if (cmd === 'with-build') {
    runWithBrandOverlay({ repoRoot, vendorRoot, map }, () => {
      execFileSync('pnpm', ['run', 'build'], {
        cwd: vendorRoot,
        stdio: 'inherit',
        env: { ...process.env, CI: 'true' },
      })
    })
    return
  }
  throw new ApplyBrandError('usage: apply-brand.ts apply | restore | with-build')
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    main()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(message)
    process.exit(1)
  }
}
