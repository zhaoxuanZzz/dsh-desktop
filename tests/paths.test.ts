import { describe, expect, it } from 'vitest'
import { join } from 'node:path'
import {
  buildLaunchArgs,
  buildLaunchEnv,
  resolveLaunchPaths,
  type LaunchContext,
} from '../src/main/paths.ts'

const posixCtx = (over: Partial<LaunchContext>): LaunchContext => ({
  packaged: false,
  repoRoot: '/repo',
  resourcesPath: '/app/Resources',
  platform: 'darwin',
  hostNode: '/usr/local/bin/node',
  ...over,
})

describe('resolveLaunchPaths', () => {
  it('uses host node and submodule bin in development', () => {
    const paths = resolveLaunchPaths(posixCtx({ packaged: false }))
    expect(paths.nodeExecutable).toBe('/usr/local/bin/node')
    expect(paths.dshBin).toBe(join('/repo', 'vendor/deepseek-harness/apps/cli/lib/bin.js'))
  })

  it('uses extraResources in packaged macOS', () => {
    const paths = resolveLaunchPaths(posixCtx({ packaged: true }))
    expect(paths.nodeExecutable).toBe(join('/app/Resources', 'node/bin/node'))
    expect(paths.dshBin).toBe(join('/app/Resources', 'dsh/lib/bin.js'))
  })

  it('uses node.exe on packaged Windows', () => {
    const paths = resolveLaunchPaths(posixCtx({ packaged: true, platform: 'win32' }))
    expect(paths.nodeExecutable).toBe(join('/app/Resources', 'node/node.exe'))
  })
})

describe('buildLaunchEnv', () => {
  it('copies env and does not invent DSH_HOME', () => {
    const env = buildLaunchEnv({ PATH: '/bin' })
    expect(env.PATH).toBe('/bin')
    expect(env.DSH_HOME).toBeUndefined()
  })

  it('preserves existing DSH_HOME', () => {
    expect(buildLaunchEnv({ DSH_HOME: '/custom' }).DSH_HOME).toBe('/custom')
  })
})

describe('buildLaunchArgs', () => {
  it('always uses loopback and OS-assigned port', () => {
    expect(buildLaunchArgs('/dsh/lib/bin.js')).toEqual([
      '/dsh/lib/bin.js',
      'web',
      '--host',
      '127.0.0.1',
      '--port',
      '0',
    ])
  })
})
