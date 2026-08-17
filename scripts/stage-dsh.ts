import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveDshBin } from './dsh-bin.ts'
import { loadOverlayMap, runWithBrandOverlay } from './apply-brand.ts'
import { execPnpm } from './pnpm.ts'
import { hoistMissingWorkspacePackages } from './hoist-workspace-packages.ts'
import { DshSupervisor } from '../src/main/dsh-process.ts'
import { buildLaunchArgs } from '../src/main/paths.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const sub = join(root, 'vendor', 'deepseek-harness')
const out = join(root, 'build', 'dsh')
if (!existsSync(join(sub, 'package.json'))) throw new Error('missing vendor/deepseek-harness submodule')
const pnpmEnv = { ...process.env, CI: 'true' }
execPnpm(['install'], { cwd: sub, stdio: 'inherit', env: pnpmEnv })
const map = loadOverlayMap(root)
runWithBrandOverlay({ repoRoot: root, vendorRoot: sub, map }, () => {
  execPnpm(['run', 'build'], { cwd: sub, stdio: 'inherit', env: pnpmEnv })
})
rmSync(out, { recursive: true, force: true })
mkdirSync(join(root, 'build'), { recursive: true })
// Legacy deploy leaves dangling links into the source tree. --prod drops CLI
// runtime plugins that live in devDependencies. inject + hoist copies files.
execPnpm(
  [
    '--filter',
    '@deepseek-ai/dsh',
    'deploy',
    out,
    '--config.inject-workspace-packages=true',
    '--config.dangerouslyAllowAllBuilds=true',
    '--config.node-linker=hoisted',
    '--config.link-workspace-packages=true',
  ],
  { cwd: sub, stdio: 'inherit', env: pnpmEnv },
)
const copied = hoistMissingWorkspacePackages(sub, out)
if (copied.length > 0) console.log(`stage-dsh: hoisted workspace peers: ${copied.join(', ')}`)
const pkg = JSON.parse(readFileSync(join(out, 'package.json'), 'utf8')) as { bin?: string | Record<string, string> }
const bin = resolveDshBin(out, pkg)
if (!existsSync(bin)) throw new Error(`deployed dsh bin missing: ${bin}`)
const nodeBin = process.platform === 'win32' ? join(root, 'build/node/node.exe') : join(root, 'build/node/bin/node')
const runner = existsSync(nodeBin) ? nodeBin : process.execPath
const supervisor = new DshSupervisor()
await supervisor.start({
  nodeExecutable: runner,
  args: buildLaunchArgs(bin),
  cwd: homedir(),
  env: { ...process.env },
})
await supervisor.stop()
