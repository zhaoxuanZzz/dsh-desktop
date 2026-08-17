import { describe, expect, it } from 'vitest'
import {
  DEFAULT_WINDOW_STATE,
  MIN_HEIGHT,
  MIN_WIDTH,
  clampWindowState,
  parseWindowState,
} from '../src/main/window-state.ts'

describe('parseWindowState', () => {
  it('returns defaults for garbage', () => {
    expect(parseWindowState(undefined)).toEqual(DEFAULT_WINDOW_STATE)
    expect(parseWindowState('{')).toEqual(DEFAULT_WINDOW_STATE)
  })

  it('reads a saved payload', () => {
    const raw = JSON.stringify({
      bounds: { x: 10, y: 20, width: 1400, height: 900 },
      isMaximized: true,
      zoomFactor: 1.25,
    })
    expect(parseWindowState(raw)).toEqual({
      bounds: { x: 10, y: 20, width: 1400, height: 900 },
      isMaximized: true,
      zoomFactor: 1.25,
    })
  })
})

describe('clampWindowState', () => {
  it('enforces minimum size', () => {
    const clamped = clampWindowState(
      {
        bounds: { x: 0, y: 0, width: 100, height: 100 },
        isMaximized: false,
        zoomFactor: 1,
      },
      { width: 1920, height: 1080 },
    )
    expect(clamped.bounds.width).toBe(MIN_WIDTH)
    expect(clamped.bounds.height).toBe(MIN_HEIGHT)
  })

  it('rejects non-positive zoom', () => {
    const clamped = clampWindowState(
      { ...DEFAULT_WINDOW_STATE, zoomFactor: 0 },
      { width: 1920, height: 1080 },
    )
    expect(clamped.zoomFactor).toBe(1)
  })
})
