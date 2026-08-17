export function parseReadyUrl(text: string): string | undefined {
  const match = /dsh web: (http:\/\/127\.0\.0\.1:\d+)(?:\s|$)/.exec(text)
  return match?.[1]
}

export function scanReadyOutput(acc: string, chunk: string): { acc: string; url: string | undefined } {
  const next = acc + chunk
  const match = /(?:^|\n)dsh web: (http:\/\/127\.0\.0\.1:\d+)(?:\s|\n)/.exec(next)
  return { acc: next, url: match?.[1] }
}
