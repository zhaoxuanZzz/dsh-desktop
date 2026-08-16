import { spawnSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'

describe('DESIGN.md', () => {
  it('lints with zero errors', () => {
    const r = spawnSync('pnpm', ['exec', 'designmd', 'lint', 'DESIGN.md'], {
      encoding: 'utf8',
    })
    expect(r.status, r.stderr || r.stdout).toBe(0)
    const report = JSON.parse(r.stdout) as { summary: { errors: number } }
    expect(report.summary.errors).toBe(0)
  })
})
