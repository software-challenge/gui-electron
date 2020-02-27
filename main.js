const {app, BrowserWindow, ipcMain, dialog} = require('electron')
const {autoUpdater} = require('electron-updater')
// Ignore warning about third-party AMD drivers on linux
app.commandLine.appendSwitch('ignore-gpu-blacklist', 'true')
const path = require('path')
const url = require('url')
const fs = require('fs')

// init for updates
autoUpdater.setFeedURL({
  provider: 'github',
  repo: 'socha-gui',
  owner: 'CAU-Kiel-Tech-Inf',
  vPrefixedTagName: false,
})
autoUpdater.on('error', (error) => {
  dialog.showErrorBox('Error: ', error == null ? 'unknown' : (error.stack || error).toString())
})

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win
let splashWin

function createWindow() {
  splashWin = new BrowserWindow({
    width: 300,
    height: 200,
    frame: false,
    alwaysOnTop: true,
  })
  splashWin.loadFile(path.join(app.getAppPath(), 'assets/build-resources/icon512x512.png'))

  // Create the browser window.
  win = new BrowserWindow({
    kiosk: app.commandLine.hasSwitch('kiosk'),
    icon: 'assets/build-resources/icon64x64.png',
    width: app.commandLine.hasSwitch('dev') ? 1500 : 1000,
    height: 850,
    webPreferences: {
      nodeIntegration: true,
      webgl: true,
      experimentalFeatures: true,
      experimentalCanvasFeatures: true,
    },
    show: false,
  })
  let logDir
  let appDir = app.getAppPath()
  // application path may be a directory (in dev mode) or a file (when distributed)
  // .asar files are identified as directories, but are not directories in the filesystem
  if(fs.lstatSync(appDir).isDirectory()) {
    console.log('Application directory', appDir)
    logDir = appDir.endsWith('.asar') ? process.platform === 'win32'?  '.' : '/var/tmp' : appDir
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
  if(app.commandLine.hasSwitch('dev')) {
    win.webContents.openDevTools()
  } else if(app.commandLine.hasSwitch('kiosk')) {
    win.removeMenu()
    win.setMenu(null)
  } else {
    win.removeMenu()
    win.setMenu(null)

    // Dies ist auch eine einfachere Version des Auto-Updates und installiert sich bei einem Neustart automatisch
    autoUpdater.checkForUpdatesAndNotify()
  }

  win.once('ready-to-show', () => {
    splashWin.destroy()
    win.show()
  })

  // Emitted when the window is closed.
  win.on('closed', () => {
    win.destroy()
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