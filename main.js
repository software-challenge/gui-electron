const {app, BrowserWindow, ipcMain, dialog} = require('electron')
const {autoUpdater} = require('electron-updater')

// AutoUpdater event-listener
autoUpdater.autoDownload = false

autoUpdater.on('error', (error) => {
  dialog.showErrorBox('Error: ', error == null ? 'unknown' : (error.stack || error).toString())
})

autoUpdater.on('update-available', () => {
  dialog.showMessageBox(null,
    {
      type: 'info',
      title: 'Update verfügbar',
      message: 'Es wurde ein Update gefunden, welches neue Features oder Bugfixes enthalten kann.\nMehr Informationen sind unter https://github.com/CAU-Kiel-Tech-Inf/socha-gui/releases/latest verfügbar',
      buttons: ['Jetzt herunterladen', 'Vielleicht wann anders'],
    }).then(result => {
    if(result.response === 0) {
      autoUpdater.downloadUpdate()
    }
  })
})

autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox(null, {
    type: 'question',
    buttons: ['Jetzt installieren und neustarten', 'Später'],
    message: 'Das Update wurde erfolgreich geladen und kann jetzt installiert werden',
  }).then(result => {
    if(result.response === 0) {
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


// Ignore warning about third-party AMD drivers on linux
app.commandLine.appendSwitch('ignore-gpu-blacklist', 'true')


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
  splashWin.loadFile('assets/build-resources/icon512x512.png')

  // Create the browser window.
  win = new BrowserWindow({
    kiosk: app.commandLine.hasSwitch('kiosk'),
    icon: 'assets/build-resources/icon64x64.png',
    width: 1000,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      webgl: true,
      experimentalFeatures: true,
      experimentalCanvasFeatures: true,
    },
    show: false,
  })
  win.loadFile(`src/index.html`)

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
    // autoUpdater.checkForUpdatesAndNotify()
    autoUpdater.checkForUpdates()
  }

  win.once('ready-to-show', () => {
    splashWin.destroy()
    win.show()
  })

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