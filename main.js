require('hazardous')
const {app, BrowserWindow, ipcMain, dialog} = require('electron')
const {autoUpdater} = require('electron-updater')
// Ignore warning about third-party AMD drivers on linux
app.commandLine.appendSwitch('ignore-gpu-blacklist', 'true')
const path = require('path')
const url = require('url')
const fs = require('fs')

// remove comment to build kiosk-mode dist
// global.kioskMode = true
autoUpdater.autoDownload = false

function appUpdater() {
  autoUpdater.on('error', (error) => {
    dialog.showErrorBox('Error: ', error == null ? 'unknown' : (error.stack || error).toString())
  })

  autoUpdater.on('update-available', () => {
    dialog.showMessageBox({
      type: 'info',
      title: 'Update verfügbar',
      message: 'Es wurde ein Update gefunden, welches neue Features oder Bugfixes enthalten kann.\nMehr Informationen sind unter https://github.com/CAU-Kiel-Tech-Inf/socha-gui/releases/latest verfügbar',
      buttons: ['Jetzt herunterladen', 'Vielleicht wann anders'],
    }, (buttonIndex) => {
      if(buttonIndex === 0) {
        autoUpdater.downloadUpdate()
      }
    })
  })

  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox({
      type: 'question',
      buttons: ['Jetzt installieren und neustarten', 'Später'],
      message: 'Das Update wurde erfolgreich geladen und kann jetzt installiert werden',
    }, response => {
      if(response === 0) {
        setTimeout(() => autoUpdater.quitAndInstall(), 1)
      }
    })
  })

  // init for updates
  autoUpdater.setFeedURL({
    provider: 'github',
    repo: 'socha-gui',
    owner: 'CAU-Kiel-Tech-Inf',
    vPrefixedTagName: false,
  })
  autoUpdater.checkForUpdates()
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

// Set log path

// enable tracing of unhandled promise rejections
const process = require('process')
process.traceProcessWarnings = true
process.on('unhandledRejection', (reason, promise) => {
  console.log('XXXXXXXX       Unhandled Rejection at:', reason.stack || reason)
  // Recommended: send the information to sentry.io
  // or whatever crash reporting service you use
})

function createWindow() {
  let args = process.argv.slice(2)
  let isDev = args.some(value => value === '--dev')
  if(!global.kioskMode) {
    global.kioskMode = args.some(value => value === '--kiosk')
  }

  // Create the browser window.
  win = new BrowserWindow({
    kiosk: kioskMode,
    width: isDev ? 1500 : 1000,
    height: 850,
    webPreferences: {
      nodeIntegration: true,
    },
    icon: path.join(__dirname, 'assets/build-resources/icon64.png'),
  })

  let logDir
  let appDir = app.getAppPath()
  // application path may be a directory (in dev mode) or a file (when distributed)
  // .asar files are identified as directories, but are not directories in the filesystem
  if(fs.lstatSync(appDir).isDirectory()) {
    console.log('Application directory', appDir)
    logDir = appDir.endsWith('.asar') ? '/var/tmp' : appDir
  } else {
    console.log('Application file', appDir)
    logDir = path.dirname(appDir)
  }

  // and load the index.html of the app.
  win.loadURL(url.format({
    pathname: path.join(app.getAppPath(), 'src/index.html'),
    protocol: 'file:',
    slashes: true,
  }) + '?dirname=' + encodeURIComponent(logDir), {
    //WebGL needs to be forced on with older radeon cards
    webgl: true,
    //Some extra features to speed up canvas/GL operations
    experimentalFeatures: true,
    experimentalCanvasFeatures: true,
    //Enable offscreen rendering
    offscreen: true,
  })

  // Open the DevTools.
  if(isDev) {
    win.webContents.openDevTools()
  } else if(kioskMode) {
    win.removeMenu()
    win.setMenu(null)
  } else {
    win.removeMenu()
    win.setMenu(null)
    appUpdater()
  }

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if(process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if(win === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.B
ipcMain.on('showErrorBox', (event, title, message) => {
  const {dialog} = require('electron')
  console.log(title, message)
  dialog.showErrorBox(title, message)
})
ipcMain.on('showGameErrorBox', (event, title, gameId, message) => {
  win.webContents.send('showGame', gameId)
  const {dialog} = require('electron')
  console.log(title, message)
  dialog.showErrorBox(title, message)
})
ipcMain.on('kioskGameOver', (event, gameId) => {
  win.webContents.send('closeGame', gameId)
})