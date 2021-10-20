import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { output } from './output';

const fsExists = promisify(fs.exists);
const fsWriteFile = promisify(fs.writeFile);
const fsReadFile = promisify(fs.readFile);

export async function updateConfig() {
  const cwd = process.cwd();
  // console.log('cwd:', cwd);
  if (
    cwd.indexOf('node_modules/@nstudio/xplat') === -1 &&
    cwd.indexOf('node_modules\\@nstudio\\xplat') === -1
  ) {
    // ignore: local development
    return;
  }

  // console.log(process.cwd());
  let configFilename = 'nx.json';
  let nxConfigPath = path.join(
    process.cwd(),
    '/../../..',
    configFilename
  );
  if (!fs.existsSync(nxConfigPath)) {
    configFilename = 'angular.json';
    nxConfigPath = path.join(process.cwd(), '/../../..', configFilename);
  }
  // console.log(workspaceConfigPath);
  try {
    let ngCli: any;
    let config = fs.readFileSync(nxConfigPath, { encoding: 'utf-8' });
    if (config) {
      ngCli = JSON.parse(config);
      // update default
      ngCli.cli.defaultCollection = '@nstudio/xplat';
    } else {
      // could be empty Nx workspace
      // create angular.json in order to ng add packages
      ngCli = {
        version: 1,
        projects: {},
        cli: {
          defaultCollection: '@nstudio/xplat',
        },
      };
    }
    fs.writeFileSync(nxConfigPath, JSON.stringify(ngCli, null, 2));
  } catch (err) {
    console.warn(
      `An issue was detected during installation: ${configFilename} does not exist.`
    );
  }
}

updateConfig();
