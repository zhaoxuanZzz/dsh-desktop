import { appendFileSync, existsSync, renameSync, statSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'

export interface RotatingFileLogOptions {
  dir: string
  basename: string
  maxBytes: number
  files: number
}

export const DEFAULT_LOG_MAX_BYTES = 10 * 1024 * 1024
export const DEFAULT_LOG_FILES = 3

export class RotatingFileLog {
  private readonly path: string
  private readonly maxBytes: number
  private readonly files: number

  constructor(options: RotatingFileLogOptions) {
    this.path = join(options.dir, `${options.basename}.log`)
    this.maxBytes = options.maxBytes
    this.files = options.files
  }

  write(line: string): void {
    const text = line.endsWith('\n') ? line : `${line}\n`
    this.rotateIfNeeded(text.length)
    appendFileSync(this.path, text)
  }

  flush(): void {
    // writes are eager so rotation can happen per line
  }

  private rotateIfNeeded(incoming: number): void {
    let size = 0
    if (existsSync(this.path)) size = statSync(this.path).size
    if (size + incoming < this.maxBytes) return
    for (let i = this.files - 1; i >= 1; i -= 1) {
      const from = i === 1 ? this.path : `${this.path}.${String(i - 1)}`
      const to = `${this.path}.${String(i)}`
      if (existsSync(to)) unlinkSync(to)
      if (existsSync(from)) renameSync(from, to)
    }
  }
}
