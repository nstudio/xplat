const electron = require('electron');
// Module to control application life.
const app = electron.app;
const Menu = electron.Menu;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;
const shell = electron.shell;

const fs = require('fs');
const path = require('path');
const url = require('url');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let menu;

const supportedPlatforms = ['web', 'nativescript', 'ionic'];
const apps = [];
// let workspaceName;

// const ngCliConfigPath = path.join(process.cwd(), 'angular.json');

// if (ngCliConfigPath) {
//   const ngCli = fs.readFileSync(ngCliConfigPath, 'UTF-8');
//   console.log(ngCli);
//   if (ngCli) {
//     const cli = JSON.parse(ngCli);
//     workspaceName = cli.npmScope;

//     // console.log(JSON.stringify(cli, null, 2));
//   }
// }

function getIconForPlatform(platform) {
  switch (platform) {
    case 'web':
      return 'ion-ios-world';
    case 'desktop':
      return 'ion-android-desktop';
    case 'nativescript':
      return 'ion-iphone';
  }
}

// console.log('process.cwd():', process.cwd());
// console.log(`process.cwd():, '/..'`, path.join(process.cwd(), '/..'));
// console.log(`process.cwd(), '/../..':`, path.join(process.cwd(), '/../..'));
const appsFolder = path.join(process.cwd(), 'apps');
console.log('Configuring apps:');
fs.readdirSync(appsFolder).forEach(file => {
  if (file && file.indexOf('.') !== 0) {
    console.log('* ', file);
    const parts = file.split('-');
    const platform = parts[0];
    if (supportedPlatforms.includes(platform)) {
      apps.push({
        platform: platform,
        name: parts.slice(1).join('-'),
        // icon: getIconForPlatform(platform)
      });
    }
  }
});
// console.log('apps:',JSON.stringify(apps));

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 800, height: 600, titleBarStyle: 'hiddenInset'})

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  });

  mainWindow.webContents.on('did-navigate-in-page', (e, url) => {
    console.log(`Page navigated: ${url}`);
  });

  let appTitle = `@sketchpoints xplat admin`;

  let helpMenu = {
    label: 'Help',
    submenu: [{
      label: 'Learn More',
      click:() => {
        shell.openExternal('https://nstudio.io/xplat');
      }
    }, {
      label: 'Nrwl Nx',
      click:() => {
        shell.openExternal('https://nrwl.io/nx');
      }
    }, {
        label: 'Angular',
        click:() => {
          shell.openExternal('https://angular.io/');
        }
      }, {
        label: 'Electron',
        click:() => {
          shell.openExternal('https://electronjs.org/');
        }
      }, {
        label: 'NativeScript',
        click:() => {
          shell.openExternal('https://www.nativescript.org/');
        }
      }, {
        label: 'Issues',
        click:() => {
          shell.openExternal('https://github.com/nstudio/schematics-issues');
        }
      }]
  };

  if (process.platform === 'darwin') {
    template = [{
      label: appTitle,
      submenu: [{
        label: `About ${appTitle}`,
        selector: 'orderFrontStandardAboutPanel:'
      }, {
          type: 'separator'
        }, {
          label: 'Services',
          submenu: []
        }, {
          type: 'separator'
        }, {
          label: 'Hide xplat admin',
          accelerator: 'Command+H',
          selector: 'hide:'
        }, {
          label: 'Hide Others',
          accelerator: 'Command+Shift+H',
          selector: 'hideOtherApplications:'
        }, {
          label: 'Show All',
          selector: 'unhideAllApplications:'
        }, {
          type: 'separator'
        }, {
          label: 'Quit',
          accelerator: 'Command+Q',
          click:() => {
            app.quit();
          }
        }]
    }, {
        label: 'Edit',
        submenu: [{
          label: 'Undo',
          accelerator: 'Command+Z',
          selector: 'undo:'
        }, {
            label: 'Redo',
            accelerator: 'Shift+Command+Z',
            selector: 'redo:'
          }, {
            type: 'separator'
          }, {
            label: 'Cut',
            accelerator: 'Command+X',
            selector: 'cut:'
          }, {
            label: 'Copy',
            accelerator: 'Command+C',
            selector: 'copy:'
          }, {
            label: 'Paste',
            accelerator: 'Command+V',
            selector: 'paste:'
          }, {
            label: 'Select All',
            accelerator: 'Command+A',
            selector: 'selectAll:'
          }]
      }, {
        label: 'View',
        submenu: (process.env.NODE_ENV === 'development') ? [{
          label: 'Reload',
          accelerator: 'Command+R',
          click:() => {
            mainWindow.reload();
          }
        }, {
            label: 'Toggle Full Screen',
            accelerator: 'Ctrl+Command+F',
            click:() => {
              mainWindow.setFullScreen(!mainWindow.isFullScreen());
            }
          }, {
            label: 'Toggle Developer Tools',
            accelerator: 'Alt+Command+I',
            click:() => {
              mainWindow.toggleDevTools();
            }
          }] : [{
            label: 'Toggle Full Screen',
            accelerator: 'Ctrl+Command+F',
            click:() => {
              mainWindow.setFullScreen(!mainWindow.isFullScreen());
            }
          }]
      }, {
        label: 'Window',
        submenu: [{
          label: 'Minimize',
          accelerator: 'Command+M',
          selector: 'performMiniaturize:'
        }, {
            label: 'Close',
            accelerator: 'Command+W',
            selector: 'performClose:'
          }, {
            type: 'separator'
          }, {
            label: 'Bring All to Front',
            selector: 'arrangeInFront:'
          }]
      },
      // langMenu,
      helpMenu];

    menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  } else {
    template = [{
      label: '&File',
      submenu: [{
        label: '&Open',
        accelerator: 'Ctrl+O'
      }, {
          label: '&Close',
          accelerator: 'Ctrl+W',
          click:() => {
            mainWindow.close();
          }
        }]
    }, {
        label: '&View',
        submenu: (process.env.NODE_ENV === 'development') ? [{
          label: '&Reload',
          accelerator: 'Ctrl+R',
          click:() => {
            mainWindow.reload();
          }
        }, {
            label: 'Toggle &Full Screen',
            accelerator: 'F11',
            click:() => {
              mainWindow.setFullScreen(!mainWindow.isFullScreen());
            }
          }, {
            label: 'Toggle &Developer Tools',
            accelerator: 'Alt+Ctrl+I',
            click:() => {
              mainWindow.toggleDevTools();
            }
          }] : [{
            label: 'Toggle &Full Screen',
            accelerator: 'F11',
            click:() => {
              mainWindow.setFullScreen(!mainWindow.isFullScreen());
            }
          }]
      },
      // langMenu,
      helpMenu];
    menu = Menu.buildFromTemplate(template);
    mainWindow.setMenu(menu);
  }
}

// if (process.env.NODE_ENV === 'development') {
//   require('electron-debug')();
// }

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
