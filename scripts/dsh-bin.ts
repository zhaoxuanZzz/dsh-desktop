import { join } from 'node:path'

export function resolveDshBin(installRoot: string, pkg: { bin?: string | Record<string, string> }): string {
  const bin = pkg.bin
  const rel = typeof bin === 'string' ? bin : bin?.dsh
  if (rel === undefined || rel === '') throw new Error('staged dsh package.json missing bin.dsh')
  return join(installRoot, rel)
}
