import { createWriteStream, mkdirSync, rmSync, copyFileSync, chmodSync, readFileSync, mkdtempSync } from 'node:fs'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { nodeArtifact } from './node-dist.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const version = (JSON.parse(readFileSync(join(root, 'runtime-versions.json'), 'utf8')) as { node: string }).node
const artifact = nodeArtifact({
  version,
  platform: process.platform,
  arch: process.arch,
  mirror: process.env.NODEJS_ORG_MIRROR,
})
const outDir = join(root, 'build', 'node')
rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir, { recursive: true })
const tmp = mkdtempSync(join(tmpdir(), 'saddle-node-'))
const archive = join(tmp, artifact.archiveName)
const res = await fetch(artifact.url)
if (!res.ok || res.body === null) throw new Error(`download failed ${artifact.url} ${String(res.status)}`)
await pipeline(Readable.fromWeb(res.body as never), createWriteStream(archive))
execFileSync('tar', ['-xf', archive, '-C', tmp], { stdio: 'inherit' })
const extracted = join(tmp, artifact.nodeBinaryInside)
if (process.platform === 'win32') {
  copyFileSync(extracted, join(outDir, 'node.exe'))
} else {
  mkdirSync(join(outDir, 'bin'), { recursive: true })
  copyFileSync(extracted, join(outDir, 'bin', 'node'))
  chmodSync(join(outDir, 'bin', 'node'), 0o755)
}
