import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'

const EXTRAS = ['lib', 'config', 'dist'] as const

/** pnpm deploy omits workspace peers; copy any missing @deepseek-ai package's published files. */
export function hoistMissingWorkspacePackages(vendorRoot: string, destRoot: string): string[] {
  const destNm = join(destRoot, 'node_modules')
  const copied: string[] = []
  for (const pkgDir of workspacePackageDirs(vendorRoot)) {
    const pkg = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8')) as { name?: unknown }
    const name = pkg.name
    if (typeof name !== 'string' || !name.startsWith('@deepseek-ai/')) continue
    const target = join(destNm, ...name.split('/'))
    if (presentAsReal(target)) continue
    if (existsSync(target) || isSymlink(target)) unlinkSync(target)
    mkdirSync(target, { recursive: true })
    cpSync(join(pkgDir, 'package.json'), join(target, 'package.json'))
    for (const extra of EXTRAS) {
      const src = join(pkgDir, extra)
      if (existsSync(src)) cpSync(src, join(target, extra), { recursive: true })
    }
    copied.push(name)
  }
  return copied
}

function presentAsReal(path: string): boolean {
  try {
    return !lstatSync(path).isSymbolicLink()
  } catch {
    return false
  }
}

function isSymlink(path: string): boolean {
  try {
    return lstatSync(path).isSymbolicLink()
  } catch {
    return false
  }
}

function workspacePackageDirs(root: string): string[] {
  const out: string[] = []
  const walk = (dir: string): void => {
    let entries
    try {
      entries = readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }
    if (existsSync(join(dir, 'package.json'))) out.push(dir)
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name === 'node_modules' || entry.name === '.git') continue
      walk(join(dir, entry.name))
    }
  }
  walk(root)
  return out
}
