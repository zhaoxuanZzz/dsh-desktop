import { join } from 'node:path'

export interface LaunchContext {
  packaged: boolean
  repoRoot: string
  resourcesPath: string
  platform: NodeJS.Platform
  hostNode: string
}

export interface LaunchPaths {
  nodeExecutable: string
  dshBin: string
}

export function resolveLaunchPaths(ctx: LaunchContext): LaunchPaths {
  if (!ctx.packaged) {
    return {
      nodeExecutable: ctx.hostNode,
      dshBin: join(ctx.repoRoot, 'vendor/deepseek-harness/apps/cli/lib/bin.js'),
    }
  }
  const nodeExecutable =
    ctx.platform === 'win32'
      ? join(ctx.resourcesPath, 'node', 'node.exe')
      : join(ctx.resourcesPath, 'node', 'bin', 'node')
  return {
    nodeExecutable,
    dshBin: join(ctx.resourcesPath, 'dsh', 'lib', 'bin.js'),
  }
}

export function buildLaunchEnv(base: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  return { ...base }
}

export function buildLaunchArgs(dshBin: string): string[] {
  return [dshBin, 'web', '--host', '127.0.0.1', '--port', '0']
}

export function hostNodeExecutable(env: NodeJS.ProcessEnv, platform: NodeJS.Platform): string {
  const fromNpm = env.npm_node_execpath
  if (fromNpm !== undefined && fromNpm !== '') return fromNpm
  return platform === 'win32' ? 'node.exe' : 'node'
}
