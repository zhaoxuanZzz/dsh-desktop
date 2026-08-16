import { describe, expect, it } from 'vitest'
import { join } from 'node:path'
import { resolveDshBin } from '../scripts/dsh-bin.ts'

describe('resolveDshBin', () => {
  it('resolves bin.dsh relative to install root', () => {
    expect(resolveDshBin('/app/dsh', { bin: { dsh: 'lib/bin.js' } })).toBe(join('/app/dsh', 'lib/bin.js'))
  })

  it('rejects missing bin', () => {
    expect(() => resolveDshBin('/app/dsh', {})).toThrow(/bin.dsh/)
  })
})
