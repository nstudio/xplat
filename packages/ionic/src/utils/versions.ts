export const xplatVersion = '*';
export const ionicVersion = '^8.0.0';
/**
 *

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