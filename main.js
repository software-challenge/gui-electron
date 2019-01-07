require('hazardous');
const { app, BrowserWindow } = require('electron')
app.commandLine.appendSwitch('ignore-gpu-blacklist', 'true'); //Ignore warning about third-party AMD drivers on linux
const path = require('path')
const url = require('url')
const fs = require('fs')
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

//Set log path

// enable tracing of unhandled promise rejections
const process = require('process')
process.traceProcessWarnings = true;
process.on('unhandledRejection', (reason, promise) => {
  console.log('XXXXXXXX       Unhandled Rejection at:', reason.stack || reason)
  // Recommended: send the information to sentry.io
  // or whatever crash reporting service you use
});

function createWindow() {
  let args = process.argv.slice(2)
  let isDev = args.some(value => value == "--dev")

  // Create the browser window.
  win = new BrowserWindow({
    width: isDev ? 1500 : 1000,
    height: 850,
    webPreferences: {
      nodeIntegration: true
    }
  });

  let logDir = '.'
  let appDir = app.getAppPath()
  // application path may be a directory (in dev mode) or a file (when distributed)
  // .asar files are identified as directories, but are not directories in the filesystem
  if (fs.lstatSync(appDir).isDirectory() && !appDir.endsWith('.asar')) {
    console.log("directory", appDir)
    logDir = appDir
  } else {
    console.log("file", appDir)
    logDir = path.dirname(appDir)
  }

  // and load the index.html of the app.
  win.loadURL(url.format({
    pathname: path.join(app.getAppPath(), 'src/index.html'),
    protocol: 'file:',
    slashes: true
  }) + '?dirname=' + encodeURIComponent(logDir), options = {
    //WebGL needs to be forced on with older radeon cards
    webgl: true,
    //Some extra features to speed up canvas/GL operations
    experimentalFeatures: true,
    experimentalCanvasFeatures: true,
    //Enable offscreen rendering
    offscreen: true
  });

  // Open the DevTools.
  if(isDev)
    win.webContents.openDevTools()

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
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.B
