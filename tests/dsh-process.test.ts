import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'
import { describe, expect, it, vi } from 'vitest'
import { DshSupervisor } from '../src/main/dsh-process.ts'

class FakeChild extends EventEmitter {
  pid = 4242
  stdout = new PassThrough()
  stderr = new PassThrough()
  killed: string[] = []
  kill = (signal?: NodeJS.Signals): boolean => {
    this.killed.push(signal ?? 'SIGTERM')
    this.stdout.end()
    this.stderr.end()
    this.emit('exit', 0, signal ?? 'SIGTERM')
    return true
  }
}

describe('DshSupervisor', () => {
  it('resolves with the ready URL', async () => {
    const child = new FakeChild()
    const supervisor = new DshSupervisor({
      spawn: () => child,
      timeoutMs: 1000,
      stopGraceMs: 50,
      killTree: vi.fn(),
    })
    const started = supervisor.start({
      nodeExecutable: '/node',
      args: ['bin.js', 'web'],
      cwd: '/tmp',
      env: { PATH: '/bin' },
    })
    child.stdout.write('dsh web: http://127.0.0.1:9012\n')
    await expect(started).resolves.toBe('http://127.0.0.1:9012')
  })

  it('times out if no ready line', async () => {
    const child = new FakeChild()
    const killTree = vi.fn()
    const supervisor = new DshSupervisor({
      spawn: () => child,
      timeoutMs: 20,
      stopGraceMs: 10,
      killTree,
    })
    await expect(
      supervisor.start({
        nodeExecutable: '/node',
        args: ['bin.js', 'web'],
        cwd: '/tmp',
        env: {},
      }),
    ).rejects.toMatchObject({ code: 'timeout' })
    expect(killTree).toHaveBeenCalled()
  })

  it('fails when the process exits before ready', async () => {
    const child = new FakeChild()
    const supervisor = new DshSupervisor({
      spawn: () => child,
      timeoutMs: 1000,
      stopGraceMs: 10,
      killTree: vi.fn(),
    })
    const started = supervisor.start({
      nodeExecutable: '/node',
      args: ['bin.js', 'web'],
      cwd: '/tmp',
      env: {},
    })
    child.emit('exit', 1, null)
    await expect(started).rejects.toMatchObject({ code: 'launch-failed' })
  })

  it('stop SIGTERM then SIGKILL via killTree', async () => {
    const child = new FakeChild()
    child.kill = (): boolean => true
    const killTree = vi.fn()
    const supervisor = new DshSupervisor({
      spawn: () => child,
      timeoutMs: 1000,
      stopGraceMs: 15,
      killTree,
    })
    const started = supervisor.start({
      nodeExecutable: '/node',
      args: ['bin.js', 'web'],
      cwd: '/tmp',
      env: {},
    })
    child.stdout.write('dsh web: http://127.0.0.1:1\n')
    await started
    const stopped = supervisor.stop()
    await new Promise(r => setTimeout(r, 25))
    child.emit('exit', 0, 'SIGTERM')
    await stopped
    expect(killTree.mock.calls[0]?.[1]).toBe('SIGTERM')
  })
})
