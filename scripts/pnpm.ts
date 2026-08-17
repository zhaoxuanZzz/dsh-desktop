import { execFileSync, type ExecFileSyncOptions } from 'node:child_process'

export function pnpmCommand(
  env: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform,
): { file: string; prefix: string[]; shell?: boolean } {
  const js = env.npm_execpath
  if (js !== undefined && js !== '') return { file: process.execPath, prefix: [js] }
  return {
    file: platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
    prefix: [],
    shell: platform === 'win32' ? true : undefined,
  }
}

export function execPnpm(args: string[], opts: ExecFileSyncOptions): string | Buffer {
  const { file, prefix, shell } = pnpmCommand()
  return execFileSync(file, [...prefix, ...args], { ...opts, shell })
}
