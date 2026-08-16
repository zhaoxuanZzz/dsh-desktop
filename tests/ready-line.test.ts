import { describe, expect, it } from 'vitest'
import { parseReadyUrl, scanReadyOutput } from '../src/main/ready-line.ts'

describe('parseReadyUrl', () => {
  it('extracts loopback URL', () => {
    expect(parseReadyUrl('dsh web: http://127.0.0.1:3080')).toBe('http://127.0.0.1:3080')
  })

  it('ignores LAN suffix and keeps loopback', () => {
    expect(parseReadyUrl('dsh web: http://127.0.0.1:4567 (LAN: http://192.168.1.5:4567)')).toBe(
      'http://127.0.0.1:4567',
    )
  })

  it('rejects non-loopback', () => {
    expect(parseReadyUrl('dsh web: http://192.168.1.5:3080')).toBeUndefined()
  })

  it('rejects missing prefix', () => {
    expect(parseReadyUrl('http://127.0.0.1:3080')).toBeUndefined()
  })

  it('rejects missing port', () => {
    expect(parseReadyUrl('dsh web: http://127.0.0.1')).toBeUndefined()
  })
})

describe('scanReadyOutput', () => {
  it('finds the line across chunks', () => {
    let acc = ''
    let url: string | undefined
    ;({ acc, url } = scanReadyOutput(acc, 'boot\n'))
    expect(url).toBeUndefined()
    ;({ acc, url } = scanReadyOutput(acc, 'dsh web: http://127.0.0.1:9'))
    expect(url).toBeUndefined()
    ;({ acc, url } = scanReadyOutput(acc, '012\nmore'))
    expect(url).toBe('http://127.0.0.1:9012')
  })
})
