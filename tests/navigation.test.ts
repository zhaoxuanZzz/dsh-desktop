import { describe, expect, it } from 'vitest'
import { classifyNavigation } from '../src/main/navigation.ts'

const origin = 'http://127.0.0.1:9012'

describe('classifyNavigation', () => {
  it('allows same loopback origin', () => {
    expect(classifyNavigation(origin, 'http://127.0.0.1:9012/api/x')).toBe('allow')
    expect(classifyNavigation(origin, 'http://127.0.0.1:9012/')).toBe('allow')
  })

  it('opens other http(s) externally', () => {
    expect(classifyNavigation(origin, 'https://github.com/deepseek-ai/deepseek-harness')).toBe(
      'open-external',
    )
    expect(classifyNavigation(origin, 'http://example.com')).toBe('open-external')
  })

  it('denies leaving the origin for non-http(s)', () => {
    expect(classifyNavigation(origin, 'file:///etc/passwd')).toBe('deny')
  })

  it('opens other http origins in the system browser', () => {
    expect(classifyNavigation(origin, 'http://127.0.0.1:9/')).toBe('open-external')
  })
})
