import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
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

const root = process.cwd()
const icon = readFileSync(join(root, 'resources/icon.svg'), 'utf8')
const arc1 = 'M220 620 C360 420, 664 420, 804 620'
const arc2 = 'M340 700 C512 560, 684 700, 684 700'

describe('brand materials', () => {
  it('mark.svg reuses the icon arcs and currentColor', () => {
    expect(icon).toContain(arc1)
    expect(icon).toContain(arc2)
    const svg = readFileSync(join(root, 'brand/mark.svg'), 'utf8')
    expect(svg).toContain(arc1)
    expect(svg).toContain(arc2)
    expect(svg).toContain('currentColor')
    expect(svg).not.toContain('#1c1917')
  })

  it('overlay copy is Saddle, not DeepSeek Harness', () => {
    const wordmark = readFileSync(join(root, 'brand/overlay/BrandWordmark.tsx'), 'utf8')
    const fish = readFileSync(join(root, 'brand/overlay/FishLogo.tsx'), 'utf8')
    const onboard = readFileSync(join(root, 'brand/overlay/onboarding-copy.ts'), 'utf8')
    expect(wordmark).not.toContain('DeepSeek Harness')
    expect(fish).not.toContain('dsh-wordmark-whale')
    expect(onboard).not.toContain('DeepSeek Harness')
    expect(onboard).toContain("WELCOME_NOTICE_VERSION = '2026-08-16.saddle'")
    expect(fish).toContain(arc1)
  })

  it('overlay-map patches use the spec strings', () => {
    const map = JSON.parse(readFileSync(join(root, 'brand/overlay-map.json'), 'utf8')) as {
      patch: { find: string; with: string }[]
    }
    const withs = map.patch.map(p => p.with)
    expect(withs).toContain('You are an AI agent running in Saddle.')
    expect(withs.some(w => w.includes('Saddle desktop app'))).toBe(true)
    expect(withs).toContain('fill="#a8a29e"')
  })

  it('overlay-map targets exist when the submodule is present', () => {
    const vendor = join(root, 'vendor/deepseek-harness')
    if (!existsSync(join(vendor, 'package.json'))) return
    const map = JSON.parse(readFileSync(join(root, 'brand/overlay-map.json'), 'utf8')) as {
      replace: { to: string }[]
      add: { to: string }[]
      patch: { to: string }[]
    }
    for (const row of [...map.replace, ...map.patch]) {
      expect(existsSync(join(vendor, row.to)), row.to).toBe(true)
    }
    for (const row of map.add) {
      expect(existsSync(join(vendor, row.to, '..')), row.to).toBe(true)
    }
  })
})
