export const MIN_WIDTH = 900
export const MIN_HEIGHT = 600

export interface WindowState {
  bounds: { x: number; y: number; width: number; height: number }
  isMaximized: boolean
  zoomFactor: number
}

export const DEFAULT_WINDOW_STATE: WindowState = {
  bounds: { x: 120, y: 80, width: 1280, height: 800 },
  isMaximized: false,
  zoomFactor: 1,
}

export function parseWindowState(raw: string | undefined): WindowState {
  if (raw === undefined) return DEFAULT_WINDOW_STATE
  try {
    const value = JSON.parse(raw) as Partial<WindowState>
    const bounds = value.bounds
    if (
      bounds === undefined ||
      typeof bounds.x !== 'number' ||
      typeof bounds.y !== 'number' ||
      typeof bounds.width !== 'number' ||
      typeof bounds.height !== 'number'
    ) {
      return DEFAULT_WINDOW_STATE
    }
    return {
      bounds,
      isMaximized: value.isMaximized === true,
      zoomFactor: typeof value.zoomFactor === 'number' ? value.zoomFactor : 1,
    }
  } catch {
    return DEFAULT_WINDOW_STATE
  }
}

export function clampWindowState(
  state: WindowState,
  workArea: { width: number; height: number },
): WindowState {
  const width = Math.min(workArea.width, Math.max(MIN_WIDTH, state.bounds.width))
  const height = Math.min(workArea.height, Math.max(MIN_HEIGHT, state.bounds.height))
  const zoomFactor = state.zoomFactor > 0 ? state.zoomFactor : 1
  return {
    bounds: { x: state.bounds.x, y: state.bounds.y, width, height },
    isMaximized: state.isMaximized,
    zoomFactor,
  }
}
