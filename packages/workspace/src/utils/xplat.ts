import {
  Tree,
  noop,
  branchAndMerge,
  mergeWith,
  apply,
  url,
  template,
  move,
  SchematicContext
} from '@angular-devkit/schematics';
import {
  getDefaultTemplateOptions,
  getPrefix,
  updateJsonFile,
  getJsonFromFile
} from './general';
import { updateJsonInTree } from '@nrwl/workspace';

export interface IXplatSchema {
  /**
   * npm scope - auto detected from nx.json but can specify your own name
   */
  npmScope?: string;
  /**
   * The prefix to apply to generated selectors.
   */
  prefix?: string;
  /**
   * Only if not present yet
   */
  onlyIfNone?: boolean;
  /**
   * Skip formatting
   */
  skipFormat?: boolean;
}

export function addPlatformFiles(
  tree: Tree,
  options: IXplatSchema,
  platform: string,
  sample: string = ''
) {
  if (!sample && tree.exists(`xplat/${platform}/core/index.ts`)) {
    return noop();
  }

  sample = sample ? `${sample}_` : '';
  return branchAndMerge(
    mergeWith(
      apply(url(`./_${sample}files`), [
        template({
          ...(options as any),
          ...getDefaultTemplateOptions()
        }),
        move(`xplat/${platform}`)
      ])
    )
  );
}

export function addLibFiles(
  tree: Tree,
  options: IXplatSchema,
  sample: string = ''
) {
  sample = sample ? `${sample}_` : '';

  if (!sample) {
    if (
      tree.exists(`libs/core/base/base-component.ts`) ||
      tree.exists(`libs/features/index.ts`)
    ) {
      return noop();
    }
  }

  return branchAndMerge(
    mergeWith(
      apply(url(`./_lib_${sample}files`), [
        template({
          ...(options as any),
          ...getDefaultTemplateOptions()
        }),
        move('libs')
      ])
    )
  );
}

export function updateTestingConfig(tree: Tree, context: SchematicContext) {
  const angularConfigPath = `angular.json`;
  const nxConfigPath = `nx.json`;

  const angularJson = getJsonFromFile(tree, angularConfigPath);
  const nxJson = getJsonFromFile(tree, nxConfigPath);
  const prefix = getPrefix();
  // console.log('prefix:', prefix);

  // update libs and xplat config
  if (angularJson && angularJson.projects) {
    angularJson.projects['libs'] = {
      root: 'libs',
      sourceRoot: 'libs',
      projectType: 'library',
      prefix: prefix,
      architect: {
        test: {
          builder: '@angular-devkit/build-angular:karma',
          options: {
            main: 'testing/test.libs.ts',
            tsConfig: 'testing/tsconfig.libs.spec.json',
            karmaConfig: 'testing/karma.conf.js'
          }
        },
        lint: {
          builder: '@angular-devkit/build-angular:tslint',
          options: {
            tsConfig: [
              'testing/tsconfig.libs.json',
              'testing/tsconfig.libs.spec.json'
            ],
            exclude: ['**/node_modules/**']
          }
        }
      }
    };
    angularJson.projects['xplat'] = {
      root: 'xplat',
      sourceRoot: 'xplat',
      projectType: 'library',
      prefix: prefix,
      architect: {
        test: {
          builder: '@angular-devkit/build-angular:karma',
          options: {
            main: 'testing/test.xplat.ts',
            tsConfig: 'testing/tsconfig.xplat.spec.json',
            karmaConfig: 'testing/karma.conf.js'
          }
        },
        lint: {
          builder: '@angular-devkit/build-angular:tslint',
          options: {
            tsConfig: [
              'testing/tsconfig.xplat.json',
              'testing/tsconfig.xplat.spec.json'
            ],
            exclude: ['**/node_modules/**']
          }
        }
      }
    };
  }

  if (nxJson && nxJson.projects) {
    nxJson.projects['libs'] = {
      tags: []
    };
    nxJson.projects['xplat'] = {
      tags: []
    };
  }

  tree = updateJsonFile(tree, angularConfigPath, angularJson);
  tree = updateJsonFile(tree, nxConfigPath, nxJson);
  return tree;
}

export function updateLint(host: Tree, context: SchematicContext) {
  const prefix = getPrefix();

  return updateJsonInTree('tslint.json', json => {
    json.rules = json.rules || {};
    // remove forin rule as collides with LogService
    delete json.rules['forin'];
    // adjust console rules to work with LogService
    json.rules['no-console'] = [true, 'debug', 'time', 'timeEnd', 'trace'];
    json.rules['directive-selector'] = [true, 'attribute', prefix, 'camelCase'];
    json.rules['component-selector'] = [true, 'element', prefix, 'kebab-case'];

    return json;
  })(host, context);
}
