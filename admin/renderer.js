// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const path = require('path');
const fs = require('fs');
const spawn = require('child_process').spawn;

// setup
const supportedPlatforms = ['web', 'nativescript', 'ionic', 'fullstack'];
const apps = [];
let appRunning = {}; // actively running apps

// workspace handling
let workspaceName = '';
const ngCliConfigPath = path.join(process.cwd(), 'angular.json');
if (ngCliConfigPath) {
  const ngCli = fs.readFileSync(ngCliConfigPath, 'UTF-8');
  // console.log(ngCli);
  if (ngCli) {
    const cli = JSON.parse(ngCli);
    workspaceName = cli.npmScope;
    // console.log(JSON.stringify(cli, null, 2));
  }
}

// mode handlings
let activeMode = 'fullstack';
let userSettingsPath = process.platform == 'darwin' ? process.env.HOME + `/Library/Application Support/Code/User/settings.json` : '/var/local/Code/User/settings.json';
const windowsHome = process.env.APPDATA;
if (windowsHome) {
  userSettingsPath = path.join(windowsHome, 'Code/User/settings.json');
}
// console.log('userSettingsPath:',userSettingsPath);
const isVsCode = fs.existsSync(userSettingsPath);
// console.log('isVsCode:',isVsCode);
if (isVsCode) {
  const userSettings = fs.readFileSync(userSettingsPath, 'UTF-8');
  if (userSettings) {
    const userSettingsJson = JSON.parse(userSettings);
    let excluded = userSettingsJson['files.exclude'];
    let isModeOn = false;
    for (const p of supportedPlatforms) {
      // console.log(p);
      // console.log('excluded[`**/apps/${p}-*`]:', excluded[`**/apps/${p}-*`]);
      // console.log('typeof excluded[`**/apps/${p}-*`]:', typeof excluded[`**/apps/${p}-*`]);
      if (p !== 'fullstack') {
        if (excluded[`**/apps/${p}-*`]) {
          isModeOn = true;
        } else {
          activeMode = p;
        }
      }
    }
    if (!isModeOn) {
      // no platforms excluded, then they are in fullstack mode
      activeMode = 'fullstack';
    }
  }
} else {
  // user settings doesn't exist yet, just ignore
}


function getIconForPlatform(platform) {
  switch (platform) {
    case 'web':
      return 'ion-ios-world';
    case 'electron':
      return 'ion-android-desktop';
    case 'ionic':
      return 'ion-iphone';
    case 'nativescript':
      return 'ion-iphone';
    case 'ssr':
      return 'ion-ios-cloud';
  }
}

function createToolAction(platform, name, id, actionName, icon, enabled) {
  return {
    id: id,
    name: name,
    actionName: actionName,
    icon: icon,
    enabled: enabled ? enabled : false,
    platform: platform,
    action: function() {
      this.enabled = !this.enabled;

      // modes
      if (this.icon.indexOf('ion-toggle') > -1) {
        this.icon = this.enabled ? 'ion-toggle-filled' : 'ion-toggle';
        // console.log('this.icon:',this.icon);
        let el = document.getElementById(`${this.id}-mode-icon`);
        el.classList.remove(this.enabled ? 'ion-toggle' : 'ion-toggle-filled');
        el.classList.add(this.icon);
        // console.log(`${this.id}-mode-icon`, el);
        // toggle all others off
        for (const p of supportedPlatforms) {
          if (appActions[p]) {
            for (const tool of appActions[p]) {
              if (p !== this.platform) {
                tool.enabled = false;
                tool.icon = 'ion-toggle';
                el = document.getElementById(`${tool.id}-mode-icon`);
                // console.log(`${tool.id}-mode-icon`, el);
                el.classList.remove('ion-toggle-filled');
                el.classList.add(tool.icon);
              }
            }
          }
        }
      } else {
        // apps
        // console.log('this.icon:',this.icon);
        let el = document.getElementById(`${this.id}-${this.actionName}`);
        el.classList.toggle('active');
        if (!this.enabled && appRunning[this.id]) {
          // just stop app process
          // npm is the process id
          // the next process up (+1) is the actually command npm ran
          process.kill(appRunning[this.id].pid);
          process.kill(appRunning[this.id].pid+1);
          // appRunning[this.id].kill('SIGINT');
          delete appRunning[this.id];
          console.log(this.id, 'process stopped.');
          return;
        }
      }
      // console.log('actionName:', actionName);
      let isNgAction = actionName.indexOf('ng') > -1;
      let cmdArg = '';
      let cmdAction = actionName;
      if (actionName.indexOf('.') > -1) {
        const parts = actionName.split('.');
        cmdAction = parts[0];
        if (isNgAction) {
          cmdAction = cmdAction.replace('ng', '').toLowerCase();
        }
        if (parts.length > 1) {
          cmdArg = `${isNgAction ? '' : '.'}${parts[1]}`;
        }
      }
      let cmd = ''
      if (isNgAction) {
        cmd = `ng g ${cmdAction} ${cmdArg}`;
      } else {
        cmd = `npm run ${cmdAction}.${platform}.${name}${cmdArg}`;
      }
      console.log('running cmd:', cmd);
      const parts = cmd.split(' ');
      cmd = parts[0];
      const argv = parts.slice(1);

      const windowsHome = process.env.APPDATA;
      if (windowsHome) {
        argv.unshift(cmd);
        argv.unshift('/c');
        argv.unshift('/s');
        // must use 'cmd'
        cmd = 'cmd';
      }
      appRunning[this.id] = spawn(cmd, argv, {stdio: 'inherit'});
      // console.log('appRunning[this.id]:', appRunning[this.id]);

      if (appRunning[this.id].stdout) {
        // these won't be available when using {stdio: 'inherit'} above
        // not sure which way we wanna go yet
        appRunning[this.id].stdout.on('data', function(data) {
          console.log('stdout: ', data.toString());
        });
      }
      if (appRunning[this.id].stderr) {
        appRunning[this.id].stderr.on('data', function(data) {
          console.log('stderr: ', data.toString());
        });
      }
      if (this.icon.indexOf('ion-toggle') === -1) {
        appRunning[this.id].on('close', (code) => {
          delete appRunning[this.id];
          console.log('stopped:', code);
          console.log(`${this.id}-${this.actionName}`);
          // app action has closed
          let el = document.getElementById(`${this.id}-${this.actionName}`);
          el.classList.toggle('active');
        });
        appRunning[this.id].on('exit', (code) => {
          console.log('exit:', code);
        });
      }

      // alertnate options
      // ls.stdout.pipe(process.stdout);
      // let ls = childProcess.exec(cmd, function(err, stdout, stderr) {
      //   if (stdout) {
      //     console.log('stdout: <' + stdout + '> ');
      //   }
      //   if (err) {
      //     console.log('err: <' + err + '> ');
      //   }
      //   if (stderr) {
      //     console.log('stderr: <' + stderr + '> ');
      //   }
      // });
    }
  };
}

function getToolsForPlatform(platform, name, id) {
  let tools = [
    createToolAction(platform, name, id, 'start', 'ion-power'),
    createToolAction(platform, name, id, 'clean', 'ion-ios-color-wand-outline')
  ];
  switch (platform) {
    case 'web':
      return tools;
    case 'electron':
      return tools;
    case 'ionic':
      tools = [
        createToolAction(platform, name, id, 'start.ios', 'ion-social-apple'),
        createToolAction(platform, name, id, 'start.android', 'ion-social-android'),
        createToolAction(platform, name, id, 'clean', 'ion-ios-color-wand-outline')
      ];
      return tools;
    case 'nativescript':
      tools = [
        createToolAction(platform, name, id, 'start.ios', 'ion-social-apple'),
        createToolAction(platform, name, id, 'start.android', 'ion-social-android'),
        createToolAction(platform, name, id, 'clean', 'ion-ios-color-wand-outline')
      ];
      return tools;
    case 'ssr':
      return tools;
  }
}

const appsFolder = path.join(process.cwd(), 'apps');
console.log('Configuring apps:');
fs.readdirSync(appsFolder).forEach(file => {
  if (file && file.indexOf('.') !== 0) {
    console.log('* ', file);
    const id = file;
    const parts = file.split('-');
    const platform = parts[0];
    const name = parts.slice(1).join('-');
    if (name !== 'xplat-admin' && supportedPlatforms.includes(platform)) {
      const tools = getToolsForPlatform(platform, name, id);
      appActions[id] = tools;
      apps.push({
        id: id,
        platform: platform,
        name: name,
        icon: getIconForPlatform(platform),
        tools: tools
      });
    }
  }
});
// console.log('apps:', JSON.stringify(apps));

function getPrettyPlatformName(name) {
  switch (name) {
    case 'web':
      return 'Web';
    case 'nativescript':
      return 'NativeScript';
    default:
      return name;
  }
}

function createWorkspaceToolHtml(id, icon, name, action) {
  return `<div id="${id}" class="workspace-tool"><span class="name">${name}</span><span id="${id}-mode-icon" class="ion ${icon}" onclick="runToolAction('${id}', '${action}')" title="Toggle"></span></div>`
}

function getToggleIcon(mode) {
  return activeMode === mode ? 'ion-toggle-filled' : 'ion-toggle'
}

const workspaceTitle = document.getElementById('workspace-title');
workspaceTitle.innerText = `@${workspaceName}`;
const workspaceTools = document.getElementById('workspace-tools');
let workspaceToolHtml = '<div class="workspace-tool title"><span class="name">Modes:</span></div>';
const icons = document.getElementById('app-icons');
let iconHtml = '';
const labels = document.getElementById('app-labels');
let labelHtml = '';

const fullstackAction = `ngMode.fullstack`;
appActions['fullstack'] = [];
const workspaceTool = createToolAction('fullstack', 'fullstack', 'fullstack', fullstackAction, getToggleIcon('fullstack'), true);
appActions['fullstack'].push(workspaceTool);

workspaceToolHtml += createWorkspaceToolHtml('fullstack', workspaceTool.icon, 'Fullstack', fullstackAction);

for (const app of apps) {
  if (!appActions[app.platform]) {
    appActions[app.platform] = [];
    // console.log('app.platform:', app.platform, ' appActions[app.platform]:', appActions[app.platform]);
    const actionName = `ngMode.${app.platform}`;
    const toolExists = appActions[app.platform].find(t => t.actionName === actionName);
    if (!toolExists) {
      const workspaceTool = createToolAction(app.platform, app.name, app.platform, actionName, getToggleIcon(app.platform));
      appActions[app.platform].push(workspaceTool);
  
      workspaceToolHtml += createWorkspaceToolHtml(app.platform, workspaceTool.icon, getPrettyPlatformName(app.platform), actionName);
    }
  }

  iconHtml += `<li><span class="ion ${app.icon}"></span></li>`;

  labelHtml += `<li>
  <hr>
  <span>${app.name}</span>
  <div class="toolbar">
  `;
  for (const tool of app.tools) {
    labelHtml += `<span id="${app.id}-${tool.actionName}" class="action-btn ion ${tool.icon}" onclick="runToolAction('${app.id}', '${tool.actionName}')" title="${tool.actionName}"></span>`;
  }
  labelHtml += `</div>
  </li>`;
}

workspaceTools.innerHTML = workspaceToolHtml;
icons.innerHTML = iconHtml;
labels.innerHTML = labelHtml;

const copyright = document.getElementById('copyright');
copyright.innerHTML = `Copyright © 2018 <a id="web-link" href="https://nstudio.io">nstudio</a>`;

