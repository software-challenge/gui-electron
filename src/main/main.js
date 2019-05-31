'use strict'

import { app, BrowserWindow } from 'electron'
import * as path from 'path'
import { format as formatUrl } from 'url'
import * as fs from 'fs'
import * as process from 'process'

import 'hazardous'

//Ignore warning about third-party AMD drivers on linux
app.commandLine.appendSwitch('ignore-gpu-blacklist', 'true')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

//Set log path

// enable tracing of unhandled promise rejections
process.traceProcessWarnings = true
process.on('unhandledRejection', (reason, promise) => {
  console.log('XXXXXXXX       Unhandled Rejection at:', reason.stack || reason)
  // Recommended: send the information to sentry.io
  // or whatever crash reporting service you use
})

const isDevelopment = process.env.NODE_ENV !== 'production'

// global reference to mainWindow (necessary to prevent window from being garbage collected)
let mainWindow

function createMainWindow() {
  const window = new BrowserWindow({ webPreferences: { nodeIntegration: true }})

  if (isDevelopment) {
    window.webContents.openDevTools()
  }

  let logDir = '.'
  let appDir = app.getAppPath()
  // application path may be a directory (in dev mode) or a file (when distributed)
  // .asar files are identified as directories, but are not directories in the filesystem
  if(fs.lstatSync(appDir).isDirectory() && !appDir.endsWith('.asar')) {
    console.log('Application directory', appDir)
    logDir = appDir
  } else {
    console.log('Application file', appDir)
    logDir = path.dirname(appDir)
  }

  let logParam = '?dirname=' + encodeURIComponent(logDir)

let extraOptions = {
  //WebGL needs to be forced on with older radeon cards
  webgl: true,
  //Some extra features to speed up canvas/GL operations
  experimentalFeatures: true,
  experimentalCanvasFeatures: true,
  //Enable offscreen rendering
  offscreen: true,
}

  if (isDevelopment) {
    window.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}/${logParam}`)
   // window.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`)
  }
  else {
    window.loadURL(formatUrl({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file',
      slashes: true
    }) + logParam)
  }

  window.on('closed', () => {
    mainWindow = null
  })

  window.webContents.on('devtools-opened', () => {
    window.focus()
    setImmediate(() => {
      window.focus()
    })
  })

  return window
}

// quit application when all windows are closed
app.on('window-all-closed', () => {
  // on macOS it is common for applications to stay open until the user explicitly quits
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // on macOS it is common to re-create a window even after all windows have been closed
  if (mainWindow === null) {
    mainWindow = createMainWindow()
  }
})

// create main BrowserWindow when electron is ready
app.on('ready', () => {
  mainWindow = createMainWindow()
})
