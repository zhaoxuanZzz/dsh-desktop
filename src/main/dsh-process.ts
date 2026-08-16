import { spawn as defaultSpawn, spawnSync, type SpawnOptions } from 'node:child_process'
import { scanReadyOutput } from './ready-line.js'

export const READY_TIMEOUT_MS = 60_000
export const STOP_GRACE_MS = 3_000

export type ErrorCode = 'launch-failed' | 'timeout' | 'exited' | 'load-failed'

export class SupervisorError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
  ) {
    super(message)
  }
}

export interface ChildLike {
  pid?: number
  stdout: NodeJS.ReadableStream | null
  stderr: NodeJS.ReadableStream | null
  kill(signal?: NodeJS.Signals): boolean
  on(event: 'exit', listener: (code: number | null, signal: NodeJS.Signals | null) => void): this
}

export type SpawnImpl = (command: string, args: string[], options: SpawnOptions) => ChildLike
export type KillTree = (pid: number, signal: 'SIGTERM' | 'SIGKILL') => void

export interface SupervisorOptions {
  spawn?: SpawnImpl
  killTree?: KillTree
  timeoutMs?: number
  stopGraceMs?: number
  onLog?: (line: string) => void
  onExit?: (code: number | null, signal: NodeJS.Signals | null) => void
}

export interface StartRequest {
  nodeExecutable: string
  args: string[]
  cwd: string
  env: NodeJS.ProcessEnv
}

export class DshSupervisor {
  private child: ChildLike | undefined
  private readonly spawnImpl: SpawnImpl
  private readonly killTreeImpl: KillTree
  private readonly timeoutMs: number
  private readonly stopGraceMs: number
  private readonly onLog: (line: string) => void
  private readonly onExit: (code: number | null, signal: NodeJS.Signals | null) => void
  private exitSeen = false

  constructor(options: SupervisorOptions = {}) {
    this.spawnImpl = options.spawn ?? ((cmd, args, opts) => defaultSpawn(cmd, args, opts))
    this.killTreeImpl = options.killTree ?? defaultKillTree
    this.timeoutMs = options.timeoutMs ?? READY_TIMEOUT_MS
    this.stopGraceMs = options.stopGraceMs ?? STOP_GRACE_MS
    this.onLog = options.onLog ?? (() => {})
    this.onExit = options.onExit ?? (() => {})
  }

  start(request: StartRequest): Promise<string> {
    const child = this.spawnImpl(request.nodeExecutable, request.args, {
      cwd: request.cwd,
      env: request.env,
      detached: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    this.child = child
    this.exitSeen = false
    let acc = ''
    let settled = false
    let ready = false

    return new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => {
        if (settled) return
        settled = true
        this.forceStop()
        reject(new SupervisorError('timeout', 'ready line not seen'))
      }, this.timeoutMs)

      const finish = (fn: () => void): void => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        fn()
      }

      child.on('exit', (code, signal) => {
        this.exitSeen = true
        this.onExit(code, signal)
        if (!ready) finish(() => reject(new SupervisorError('launch-failed', 'process exited before ready')))
      })

      const onChunk = (buf: Buffer): void => {
        const chunk = buf.toString('utf8')
        this.onLog(chunk)
        const scanned = scanReadyOutput(acc, chunk)
        acc = scanned.acc
        if (scanned.url !== undefined) {
          ready = true
          finish(() => resolve(scanned.url as string))
        }
      }
      child.stdout?.on('data', onChunk)
      child.stderr?.on('data', onChunk)
    })
  }

  async stop(): Promise<void> {
    const child = this.child
    if (child?.pid === undefined || this.exitSeen) return
    this.killTreeImpl(child.pid, 'SIGTERM')
    await sleep(this.stopGraceMs)
    if (!this.exitSeen && child.pid !== undefined) this.killTreeImpl(child.pid, 'SIGKILL')
  }

  private forceStop(): void {
    const pid = this.child?.pid
    if (pid === undefined) return
    this.killTreeImpl(pid, 'SIGKILL')
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function defaultKillTree(pid: number, signal: 'SIGTERM' | 'SIGKILL'): void {
  if (process.platform === 'win32') {
    defaultSpawn('taskkill', ['/pid', String(pid), '/T', ...(signal === 'SIGKILL' ? ['/F'] : [])], {
      detached: false,
      stdio: 'ignore',
    })
    return
  }
  posixKillTree(pid, signal)
}

function posixKillTree(pid: number, signal: 'SIGTERM' | 'SIGKILL'): void {
  const listed = spawnSync('pgrep', ['-P', String(pid)], { encoding: 'utf8' })
  const children = (listed.stdout ?? '')
    .trim()
    .split('\n')
    .map(Number)
    .filter(child => child > 0)
  for (const child of children) posixKillTree(child, signal)
  try {
    process.kill(pid, signal)
  } catch {
    // already gone
  }
}
