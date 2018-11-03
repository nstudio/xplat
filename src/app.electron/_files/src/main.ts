import { app, BrowserWindow, ipcMain, screen } from 'electron';

let applicationRef: Electron.BrowserWindow = null;

const getFromEnv = parseInt(process.env.ELECTRON_IS_DEV, 10) === 1;
const isEnvSet = 'ELECTRON_IS_DEV' in process.env;
const debugMode = isEnvSet ? getFromEnv : (process.defaultApp || /node_modules[\\/]electron[\\/]/.test(process.execPath));

/**
 * Electron window settings
 */
const mainWindowSettings: Electron.BrowserWindowConstructorOptions = {
  frame: false,
  resizable: true,
  focusable: true,
  fullscreenable: false,
  kiosk: false,
  webPreferences: {
    devTools: debugMode
  }
};

/**
 * Hooks for electron main process
 */
function initMainListener() {
  ipcMain.on('ELECTRON_BRIDGE_HOST', (event, msg) => {
    console.log('msg received', msg);
    if (msg === 'ping') {
      event.sender.send('ELECTRON_BRIDGE_CLIENT', 'pong');
    }
  });
}

/**
 * Create main window presentation
 */
function createWindow() {
  const sizes = screen.getPrimaryDisplay().workAreaSize;

  if (debugMode) {
    process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

    mainWindowSettings.width = 800;
    mainWindowSettings.height = 600;

  } else {
    Object.defineProperties(mainWindowSettings, {
      width: {
        enumerable: true,
        value: sizes.width
      },
      height: {
        enumerable: true,
        value: sizes.height
      },
      x: {
        enumerable: true,
        value: 0
      },
      y: {
        enumerable: true,
        value: 0
      }
    });
  }

  applicationRef = new BrowserWindow(mainWindowSettings);
  applicationRef.loadURL(`file:///${__dirname}/index.html`);

  applicationRef.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    applicationRef = null;
  });

  initMainListener();

  if (debugMode) {
    // Open the DevTools.
    applicationRef.webContents.openDevTools();
    // client.create(applicationRef);
  }
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // TODO perhaps hook this and wait for message bus before quitting?
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (applicationRef === null) {
    createWindow();
  }
});
