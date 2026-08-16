import type { ErrorCode } from './dsh-process.ts'

export function errorCopy(code: ErrorCode): { title: string; retry: 'quit' | 'reload' | 'restart' } {
  switch (code) {
    case 'launch-failed':
      return { title: '无法启动 Saddle，请重装', retry: 'quit' }
    case 'timeout':
      return { title: '启动超时', retry: 'quit' }
    case 'load-failed':
      return { title: '界面加载失败', retry: 'reload' }
    case 'exited':
      return { title: 'Saddle 已退出', retry: 'restart' }
    default: {
      const _never: never = code
      return _never
    }
  }
}
