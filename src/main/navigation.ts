export type NavigationDecision = 'allow' | 'deny' | 'open-external'

export function classifyNavigation(loopbackOrigin: string, targetUrl: string): NavigationDecision {
  let target: URL
  try {
    target = new URL(targetUrl)
  } catch {
    return 'deny'
  }
  const origin = new URL(loopbackOrigin)
  if (target.origin === origin.origin) return 'allow'
  if (target.protocol === 'http:' || target.protocol === 'https:') return 'open-external'
  return 'deny'
}
