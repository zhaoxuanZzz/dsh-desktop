import { describe, expect, it } from 'vitest'
import { nodeArtifact } from '../scripts/node-dist.ts'

describe('nodeArtifact', () => {
  it('builds official mac arm64 url', () => {
    const a = nodeArtifact({
      version: '22.19.0',
      platform: 'darwin',
      arch: 'arm64',
      mirror: undefined,
    })
    expect(a.url).toBe('https://nodejs.org/dist/v22.19.0/node-v22.19.0-darwin-arm64.tar.gz')
    expect(a.nodeBinaryInside).toBe('node-v22.19.0-darwin-arm64/bin/node')
  })

  it('uses NODEJS_ORG_MIRROR', () => {
    const a = nodeArtifact({
      version: '22.19.0',
      platform: 'win32',
      arch: 'x64',
      mirror: 'https://npmmirror.com/mirrors/node',
    })
    expect(a.url.startsWith('https://npmmirror.com/mirrors/node/')).toBe(true)
    expect(a.url).toContain('node-v22.19.0-win-x64.zip')
    expect(a.nodeBinaryInside).toBe('node-v22.19.0-win-x64/node.exe')
  })
})
