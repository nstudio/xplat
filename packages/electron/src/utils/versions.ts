export const xplatVersion = '*';
export const electronVersion = '^4.0.5';
/**
 * if (targetPlatforms.electron) {
      // electron complains if this is missing
      dep = {
        name: '@angular/http',
        version: angularVersion,
        type: 'dependency'
      };
      deps.push(dep);

      dep = {
        name: 'electron',
        version: '^4.0.5',
        type: 'devDependency'
      };
      deps.push(dep);

      dep = {
        name: 'electron-builder',
        version: '^20.38.4',
        type: 'devDependency'
      };
      deps.push(dep);

      dep = {
        name: 'electron-rebuild',
        version: '~1.8.4',
        type: 'devDependency'
      };
      deps.push(dep);

      dep = {
        name: 'electron-installer-dmg',
        version: '~2.0.0',
        type: 'devDependency'
      };
      deps.push(dep);

      dep = {
        name: 'electron-packager',
        version: '~13.1.0',
        type: 'devDependency'
      };
      deps.push(dep);

      dep = {
        name: 'electron-reload',
        version: '~1.4.0',
        type: 'devDependency'
      };
      deps.push(dep);

      dep = {
        name: 'electron-store',
        version: '~2.0.0',
        type: 'devDependency'
      };
      deps.push(dep);

      dep = {
        name: 'electron-updater',
        version: '~4.0.6',
        type: 'devDependency'
      };
      deps.push(dep);

      dep = {
        name: 'npm-run-all',
        version: '^4.1.5',
        type: 'devDependency'
      };
      deps.push(dep);

      dep = {
        name: 'npx',
        version: '10.2.0',
        type: 'devDependency'
      };
      deps.push(dep);

      dep = {
        name: 'wait-on',
        version: '~3.2.0',
        type: 'devDependency'
      };
      deps.push(dep);
    }

    if (targetPlatforms.ionic || targetPlatforms.electron) {
      // ability to import web scss and share it
      dep = {
        name: `@${getNpmScope()}/web`,
        version: 'file:xplat/web',
        type: 'dependency'
      };
      deps.push(dep);
    }
 */