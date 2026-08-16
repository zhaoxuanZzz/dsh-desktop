import { app, BrowserWindow, Menu, screen, shell, ipcMain } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DshSupervisor, SupervisorError, type ErrorCode } from './dsh-process.js'
import { DEFAULT_LOG_FILES, DEFAULT_LOG_MAX_BYTES, RotatingFileLog } from './log.js'
import { classifyNavigation } from './navigation.js'
import {
  buildLaunchArgs,
  buildLaunchEnv,
  hostNodeExecutable,
  resolveLaunchPaths,
} from './paths.js'
import { PRODUCT_NAME, rewriteWindowTitle } from './title.js'
import { clampWindowState, parseWindowState, type WindowState } from './window-state.js'

const here = dirname(fileURLToPath(import.meta.url))
const errorPreload = join(here, 'preload-error.js')

let win: BrowserWindow | undefined
let supervisor: DshSupervisor | undefined
let loopbackOrigin: string | undefined
let log: RotatingFileLog
let starting = false
let quitting = false

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    win?.show()
    win?.focus()
  })

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null)
    mkdirSync(app.getPath('logs'), { recursive: true })
    log = new RotatingFileLog({
      dir: app.getPath('logs'),
      basename: 'saddle',
      maxBytes: DEFAULT_LOG_MAX_BYTES,
      files: DEFAULT_LOG_FILES,
    })
    ipcMain.on('saddle:quit', () => app.quit())
    ipcMain.on('saddle:reload', () => {
      if (loopbackOrigin !== undefined) {
        win?.webContents.session.setPreloads([])
        void win?.loadURL(loopbackOrigin)
      }
    })
    ipcMain.on('saddle:restart', () => {
      void boot()
    })
    createWindow()
    void boot()
  })

  app.on('window-all-closed', () => {
    app.quit()
  })

  app.on('before-quit', event => {
    persistState()
    if (quitting || supervisor === undefined) return
    event.preventDefault()
    quitting = true
    void supervisor.stop().finally(() => {
      supervisor = undefined
      app.exit(0)
    })
  })
}

function appRoot(): string {
  return app.getAppPath()
}

function resourceFile(name: string): string {
  return join(appRoot(), 'resources', name)
}

function statePath(): string {
  return join(app.getPath('userData'), 'window-state.json')
}

function readState(): WindowState {
  return parseWindowState(existsSync(statePath()) ? readFileSync(statePath(), 'utf8') : undefined)
}

function persistState(): void {
  if (win === undefined) return
  mkdirSync(app.getPath('userData'), { recursive: true })
  writeFileSync(
    statePath(),
    JSON.stringify({
      bounds: win.getBounds(),
      isMaximized: win.isMaximized(),
      zoomFactor: win.webContents.getZoomFactor(),
    } satisfies WindowState),
  )
}

function createWindow(): void {
  const work = screen.getPrimaryDisplay().workAreaSize
  const display = clampWindowState(readState(), work)
  win = new BrowserWindow({
    ...display.bounds,
    minWidth: 900,
    minHeight: 600,
    show: true,
    title: PRODUCT_NAME,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  })
  if (display.isMaximized) win.maximize()
  win.webContents.setZoomFactor(display.zoomFactor)
  win.on('page-title-updated', (event, title) => {
    event.preventDefault()
    win?.setTitle(rewriteWindowTitle(title))
  })
  win.on('close', () => persistState())
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return
    const key = input.key.toLowerCase()
    const mod = input.meta || input.control
    if (mod && key === 'w') {
      event.preventDefault()
      win?.close()
    }
    if (mod && (key === '=' || key === '+')) {
      event.preventDefault()
      win?.webContents.setZoomFactor(win.webContents.getZoomFactor() + 0.1)
    }
    if (mod && key === '-') {
      event.preventDefault()
      win?.webContents.setZoomFactor(Math.max(0.5, win.webContents.getZoomFactor() - 0.1))
    }
    if (mod && key === '0') {
      event.preventDefault()
      win?.webContents.setZoomFactor(1)
    }
  })
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (loopbackOrigin !== undefined && classifyNavigation(loopbackOrigin, url) === 'open-external') {
      void shell.openExternal(url)
    }
    return { action: 'deny' }
  })
  win.webContents.on('will-navigate', (event, url) => {
    if (loopbackOrigin === undefined) return
    const decision = classifyNavigation(loopbackOrigin, url)
    if (decision === 'allow') return
    event.preventDefault()
    if (decision === 'open-external') void shell.openExternal(url)
  })
  win.webContents.on('did-fail-load', (_e, _code, _desc, url, isMain) => {
    if (!isMain) return
    if (url.startsWith('file://')) return
    showError('load-failed')
  })
  win.webContents.session.setPermissionRequestHandler((_wc, _perm, cb) => cb(false))
  win.webContents.session.on('will-download', (_e, item) => {
    item.setSavePath(join(app.getPath('downloads'), item.getFilename()))
  })
  void win.loadFile(resourceFile('splash.html'))
}

function showError(code: ErrorCode): void {
  if (win === undefined) return
  win.webContents.session.setPreloads([errorPreload])
  void win.loadFile(resourceFile('error.html'), { query: { code } })
}

async function boot(): Promise<void> {
  if (starting) return
  starting = true
  await supervisor?.stop()
  win?.webContents.session.setPreloads([])
  void win?.loadFile(resourceFile('splash.html'))
  const paths = resolveLaunchPaths({
    packaged: app.isPackaged,
    repoRoot: appRoot(),
    resourcesPath: process.resourcesPath,
    platform: process.platform,
    hostNode: hostNodeExecutable(process.env, process.platform),
  })
  log.write(`launch node=${paths.nodeExecutable} dsh=${paths.dshBin}`)
  supervisor = new DshSupervisor({
    onLog: chunk => log.write(chunk),
    onExit: () => {
      if (!quitting) showError('exited')
    },
  })
  try {
    const url = await supervisor.start({
      nodeExecutable: paths.nodeExecutable,
      args: buildLaunchArgs(paths.dshBin),
      cwd: homedir(),
      env: buildLaunchEnv(process.env),
    })
    loopbackOrigin = new URL(url).origin
    win?.webContents.session.setPreloads([])
    void win?.loadURL(url)
  } catch (error) {
    const code = error instanceof SupervisorError ? error.code : 'launch-failed'
    showError(code === 'exited' ? 'launch-failed' : code)
  } finally {
    starting = false
    log.flush()
  }
}
