import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { resolveDshBin } from './dsh-bin.ts'
import { loadOverlayMap, runWithBrandOverlay } from './apply-brand.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const sub = join(root, 'vendor', 'deepseek-harness')
const out = join(root, 'build', 'dsh')
if (!existsSync(join(sub, 'package.json'))) throw new Error('missing vendor/deepseek-harness submodule')
const pnpmEnv = { ...process.env, CI: 'true' }
execFileSync('pnpm', ['install'], { cwd: sub, stdio: 'inherit', env: pnpmEnv })
const map = loadOverlayMap(root)
runWithBrandOverlay({ repoRoot: root, vendorRoot: sub, map }, () => {
  execFileSync('pnpm', ['run', 'build'], { cwd: sub, stdio: 'inherit', env: pnpmEnv })
})
rmSync(out, { recursive: true, force: true })
mkdirSync(join(root, 'build'), { recursive: true })
execFileSync('pnpm', ['--filter', '@deepseek-ai/dsh', 'deploy', out, '--prod'], {
  cwd: sub,
  stdio: 'inherit',
  env: pnpmEnv,
})
const pkg = JSON.parse(readFileSync(join(out, 'package.json'), 'utf8')) as { bin?: string | Record<string, string> }
const bin = resolveDshBin(out, pkg)
if (!existsSync(bin)) throw new Error(`deployed dsh bin missing: ${bin}`)
