import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { join } from 'node:path'
import { errorCopy } from '../src/main/error-copy.ts'

describe('errorCopy', () => {
  it('maps codes to Chinese copy', () => {
    expect(errorCopy('launch-failed').title).toBe('无法启动 Saddle，请重装')
    expect(errorCopy('timeout').title).toBe('启动超时')
    expect(errorCopy('load-failed').title).toBe('界面加载失败')
    expect(errorCopy('exited').title).toBe('Saddle 已退出')
  })
})

describe('html resources', () => {
  it('splash mentions Saddle and follows color scheme', () => {
    const html = readFileSync(join('resources', 'splash.html'), 'utf8')
    expect(html).toContain('正在启动 Saddle')
    expect(html).toContain('prefers-color-scheme')
    expect(html).not.toMatch(/unofficial/i)
    expect(html).toContain('#f7f5f2')
    expect(html).toContain('#1c1917')
  })
})
