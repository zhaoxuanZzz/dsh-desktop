import { describe, expect, it } from 'vitest'
import { PRODUCT_NAME, rewriteWindowTitle } from '../src/main/title.ts'

describe('rewriteWindowTitle', () => {
  it('replaces the bare official title', () => {
    expect(rewriteWindowTitle('DeepSeek Harness')).toBe(PRODUCT_NAME)
  })

  it('replaces the official suffix', () => {
    expect(rewriteWindowTitle('主题 — DeepSeek Harness')).toBe(`主题 — ${PRODUCT_NAME}`)
  })

  it('leaves unrelated titles alone', () => {
    expect(rewriteWindowTitle('Saddle')).toBe('Saddle')
    expect(rewriteWindowTitle('random')).toBe('random')
  })
})
