import {
  apply,
  url,
  move,
  template,
  mergeWith,
  branchAndMerge,
  chain,
  noop,
  SchematicContext,
  Tree,
  Rule,
  SchematicsException,
  externalSchematic,
} from '@angular-devkit/schematics';
import { formatFiles } from '@nx/workspace';
import {
  generateOptionError,
  unsupportedPlatformError,
  needFeatureModuleError,
  stringUtils,
  updatePackageForNgrx,
  getDefaultTemplateOptions,
  XplatFeatureHelpers,
  supportedSandboxPlatforms,
  XplatHelpers,
  addGlobal,
  convertNgTreeToDevKit,
  insert,
} from '@nstudio/xplat';
import {
  supportedPlatforms,
  prerun,
  getNpmScope,
  getPrefix,
  sanitizeCommaDelimitedArg,
  PlatformTypes,
  parseProjectNameFromPath,
  getJsonFromFile,
  updateFile,
} from '@nstudio/xplat-utils';
import {
  addImportToModule,
  addProviderToModule,
  addToCollection,
  addDeclarationToModule,
  _addSymbolToNgModuleMetadata,
  getTsSourceFile,
} from './ast';
import * as ts from 'typescript';
import { insertChange } from '@nx/js';

export type IGenerateType =
  | 'component'
  | 'directive'
  | 'pipe'
  | 'service'
  | 'state';

export interface IGenerateOptions {
  name: string;
  feature?: string;
  subFolder?: string;
  projects?: string;
  needsIndex?: boolean;
  root?: boolean;
  skipFormat?: boolean;
}

export function generate(type: IGenerateType, options) {
  if (!options.name) {
    throw new Error(generateOptionError(type));
  }

  let featureName: string = getFeatureName(options);
  let platforms: Array<PlatformTypes> = [];

  const externalChains = [];

  if (options.projects) {
    // building in projects
    const projects = sanitizeCommaDelimitedArg(options.projects);
    for (const name of projects) {
      const nameParts = name.split('-');
      const platPrefix = <PlatformTypes>nameParts[0];
      const platSuffix = <PlatformTypes>nameParts[nameParts.length - 1];
      if (
        supportedPlatforms.includes(platPrefix) &&
        !platforms.includes(platPrefix)
      ) {
        // if project name is prefixed with supported platform and not already added
        platforms.push(platPrefix);
      } else if (
        supportedPlatforms.includes(platSuffix) &&
        !platforms.includes(platSuffix)
      ) {
        // if project name is suffixed with supported platform and not already added
        platforms.push(platSuffix);
      }
    }
  } else if (options.platforms) {
    // building in shared code only
    platforms = <Array<PlatformTypes>>(
      (<unknown>sanitizeCommaDelimitedArg(options.platforms))
    );
  }

  const projectChains = [];
  if (options.projects) {
    for (const fullProjectPath of options.projects.split(',')) {
      const projectName = parseProjectNameFromPath(fullProjectPath);
      const projectParts = projectName.split('-');

      const platform = supportedPlatforms.includes(
        <PlatformTypes>projectParts[0]
      )
        ? projectParts[0]
        : projectParts.length > 1
        ? projectParts[1]
        : projectParts[0];
      let appDir = platform === 'web' ? '/app' : '';
      const prefixPath = `apps/${fullProjectPath}/src${appDir}`;

      let featurePath: string;
      if (shouldTargetCoreBarrel(type, featureName)) {
        featureName = 'core';
        featurePath = `${prefixPath}/${featureName}`;
      } else {
        featurePath = `${prefixPath}/features/${featureName}`;
      }
      const featureModulePath = `${featurePath}/${featureName}.module.ts`;

      let barrelIndex: string;
      if (type === 'state') {
        barrelIndex = `${featurePath}/index.ts`;
      } else {
        barrelIndex = `${featurePath}/${type}s/index.ts`;
      }

      // console.log('will adjustProject:', projectName);
      projectChains.push((tree: Tree, context: SchematicContext) => {
        // console.log('featureModulePath:', featureModulePath);
        // console.log('projectName:', projectName);
        if (!tree.exists(featureModulePath)) {
          throw new Error(
            needFeatureModuleError(
              featureModulePath,
              featureName,
              projectName,
              true
            )
          );
        }
        return addToFeature(
          platform,
          type,
          options,
          prefixPath,
          tree
        )(tree, context);
      });

      if (type === 'state') {
        // ngrx handling
        projectChains.push((tree: Tree, context: SchematicContext) => {
          return adjustBarrelIndexForType(
            type,
            options,
            barrelIndex
          )(tree, context);
        });
        projectChains.push((tree: Tree, context: SchematicContext) => {
          return addToFeature(
            platform,
            type,
            options,
            prefixPath,
            tree,
            '_index'
          )(tree, context);
        });
        projectChains.push((tree: Tree, context: SchematicContext) => {
          return adjustFeatureModuleForState(options, featureModulePath)(
            tree,
            context
          );
        });
        projectChains.push((tree: Tree, context: SchematicContext) => {
          return updatePackageForNgrx(
            tree,
            `apps/${fullProjectPath}/package.json`
          );
        });
      } else {
        projectChains.push((tree: Tree, context: SchematicContext) => {
          return adjustBarrelIndex(type, options, barrelIndex)(tree, context);
        });
        projectChains.push((tree: Tree, context: SchematicContext) => {
          return addToFeature(
            platform,
            type,
            options,
            prefixPath,
            tree,
            '_index'
          )(tree, context);
        });
        projectChains.push((tree: Tree, context: SchematicContext) => {
          return adjustFeatureModule(
            type,
            options,
            featureModulePath
          )(tree, context);
        });
      }
    }
  } else {
    projectChains.push(noop());

    for (const platform of platforms) {
      if (supportedPlatforms.includes(platform)) {
        // externalChains.push(externalSchematic(`@nstudio/${platform}-angular`, type, options, {
        //   interactive: false
        // }));
        externalChains.push((tree: Tree, context: SchematicContext) => {
          const xplatFolderName = XplatHelpers.getXplatFoldername(
            platform,
            'angular'
          );
          return addToFeature(
            xplatFolderName,
            type,
            options,
            `libs/xplat/${xplatFolderName}`,
            tree
          );
        });
        // adjust barrel
        externalChains.push((tree: Tree, context: SchematicContext) => {
          const xplatFolderName = XplatHelpers.getXplatFoldername(
            platform,
            'angular'
          );
          return adjustBarrel(type, options, `libs/xplat/${xplatFolderName}`);
        });
        // add index barrel if needed
        externalChains.push((tree: Tree, context: SchematicContext) => {
          const xplatFolderName = XplatHelpers.getXplatFoldername(
            platform,
            'angular'
          );
          return options.needsIndex
            ? addToFeature(
                xplatFolderName,
                type,
                options,
                `libs/xplat/${xplatFolderName}`,
                tree,
                '_index'
              )(tree, context)
            : noop()(tree, context);
        });
        // adjust feature module metadata if needed
        externalChains.push((tree: Tree, context: SchematicContext) => {
          const xplatFolderName = XplatHelpers.getXplatFoldername(
            platform,
            'angular'
          );
          return adjustModule(
            tree,
            type,
            options,
            `libs/xplat/${xplatFolderName}`
          );
        });
      } else {
        throw new Error(unsupportedPlatformError(platform));
      }
    }
  }

  return chain([
    prerun(),
    (tree: Tree, context: SchematicContext) =>
      // for entire workspace usage
      // no projects and no specific platforms specified
      !options.projects && platforms.length === 0
        ? addToFeature('', type, options, 'libs/xplat', tree)(tree, context)
        : noop()(tree, context),
    // adjust libs barrel
    (tree: Tree, context: SchematicContext) =>
      !options.projects && platforms.length === 0
        ? adjustBarrel(type, options, 'libs/xplat')(tree, context)
        : noop()(tree, context),
    // add index barrel if needed
    (tree: Tree, context: SchematicContext) =>
      options.needsIndex
        ? addToFeature(
            '',
            type,
            options,
            'libs/xplat',
            tree,
            '_index'
          )(tree, context)
        : noop()(tree, context),
    // adjust feature module metadata if needed
    (tree: Tree, context: SchematicContext) =>
      !options.projects && platforms.length === 0
        ? adjustModule(tree, type, options, 'libs/xplat')(tree, context)
        : noop()(tree, context),

    // project handling
    (tree: Tree, context: SchematicContext) => chain(projectChains),
    (tree: Tree, context: SchematicContext) => chain(externalChains),
    // dependency updates
    (tree: Tree, context: SchematicContext) =>
      !options.projects && type === 'state'
        ? // ensure ngrx dependencies are added to root package
          updatePackageForNgrx(tree)
        : noop()(tree, context),
    formatFiles({ skipFormat: options.skipFormat }),
  ]);
}

export function getFeatureName(options: IGenerateOptions) {
  let featureName: string;
  const isNxLib = XplatHelpers.isFeatureNxLib(options.feature);
  if (options.feature) {
    if (isNxLib) {
      // use lib name "as-is"
      featureName = options.feature.toLowerCase();
    } else {
      // otherwise, user is wanting to target a feature nested in a folder (within features)
      const dirParts = options.feature.split('/');
      if (dirParts.length) {
        featureName = dirParts.pop().toLowerCase();
      }
    }
  }
  if (!featureName) {
    if (options.projects) {
      // default to shared barrel
      featureName = 'shared';
    } else {
      // default to ui barrel
      featureName = 'ui';
    }
  }
  return featureName;
}

export function getNxFeaturePath(tree: Tree, featureName: string) {
  const tsConfig = getJsonFromFile(tree, 'tsconfig.base.json');
  if (tsConfig) {
    if (
      tsConfig.compilerOptions &&
      tsConfig.compilerOptions.paths &&
      tsConfig.compilerOptions.paths[featureName]
    ) {
      let libPath = tsConfig.compilerOptions.paths[featureName][0];
      return libPath.replace('index.ts', 'lib');
    } else {
      throw new Error(
        `No lib barrel path found in tsconfig.base.json matching "${featureName}"`
      );
    }
  } else {
    throw new Error('Workspace must have tsconfig.base.json.');
  }
  return null;
}

export function addToFeature(
  xplatFolderName: string,
  type: IGenerateType,
  options: IGenerateOptions,
  prefixPath: string,
  tree: Tree,
  extra: string = '',
  forSubFolder?: boolean
) {
  let featureName: string = getFeatureName(options);
  const isNxLib = XplatHelpers.isFeatureNxLib(featureName);

  let directory = '';
  let relativeDirectory = '';
  if (!isNxLib && options.feature) {
    const dirParts = options.feature.split('/');
    if (dirParts.length) {
      dirParts.pop();
      directory = dirParts.join('/');
      const relative = [];
      dirParts.forEach(() => relative.push('..'));
      relativeDirectory = relative.join('/') + '/';
    }
  }

  options.needsIndex = false; // reset

  const srcSubFolderPath = options.projects ? '' : '/src/lib';
  let featurePath: string;
  // support targeting Nx libs with feature argument using the lib barrel (ie, @scope/mylib)
  if (isNxLib) {
    featurePath = getNxFeaturePath(tree, featureName);
  } else if (shouldTargetCoreBarrel(type, featureName)) {
    // services and/or state should never be generated in shared or ui features
    // therefore place in core (since they are service level)
    featureName = 'core';
    featurePath = `${prefixPath}/${featureName}${srcSubFolderPath}`;
  } else {
    featurePath = `${prefixPath}/features${srcSubFolderPath}/${
      directory ? directory + '/' : ''
    }${featureName}`;
  }

  const featureModulePath = `${featurePath}/${featureName}.module.ts`;
  let moveTo: string;
  if (extra === '_base' || extra === '_base_index') {
    // always in libs
    moveTo = `libs/xplat/features/src/lib/${featureName}/base`;
  } else {
    moveTo = `${featurePath}/${type}${type === 'state' ? '' : 's'}`;
    if (!isNxLib && !tree.exists(featureModulePath)) {
      let optionName: string;
      if (prefixPath !== 'libs') {
        // parse platform from prefix
        const parts = prefixPath.split('/');
        if (parts.length > 1) {
          optionName = parts[2];
        }
      }
      throw new Error(
        needFeatureModuleError(featureModulePath, featureName, optionName)
      );
    }
  }
  if (forSubFolder && options.subFolder) {
    moveTo += `/${options.subFolder}`;
  }
  // console.log('moveTo:', moveTo);

  const indexPath = `${moveTo}/index.ts`;
  if (
    (extra === '_index' || extra === '_base_index') &&
    tree.exists(indexPath)
  ) {
    // already has an index barrel
    return noop();
  } else {
    return branchAndMerge(
      mergeWith(
        apply(url(`./${extra}_files`), [
          template({
            ...(options as any),
            ...getDefaultTemplateOptions(),
            name: options.name.toLowerCase(),
            relativeDirectory,
            xplatFolderName,
            // feature: featureName,
            forSubFolder,
          }),
          move(moveTo),
        ])
      )
    );
  }
}

export function isFeatureInGeneralBarrel(featureName: string) {
  // 'shared' barrel is for app specific shared components, pipes, directives (not service level features)
  // 'ui' barrel is for entire workspace ui related sharing of components, pipes, directives (not service level features)
  return featureName === 'shared' || featureName === 'ui';
}

export function shouldTargetCoreBarrel(
  type: IGenerateType,
  featureName: string
) {
  // when service or state is being generated with no options, it falls back to shared/ui
  // services and state should never be generated in shared or ui features
  // therefore target core barrel
  return (
    (type === 'service' || type === 'state') &&
    isFeatureInGeneralBarrel(featureName)
  );
}

export function adjustBarrel(
  type: IGenerateType,
  options: IGenerateOptions,
  prefix: string
) {
  let featureName: string = getFeatureName(options);
  const srcSubFolderPath = options.projects ? '' : '/src/lib';
  let barrelIndexPath: string;
  if (shouldTargetCoreBarrel(type, featureName)) {
    if (type === 'state') {
      barrelIndexPath = `${prefix}/core${srcSubFolderPath}/index.ts`;
    } else {
      barrelIndexPath = `${prefix}/core${srcSubFolderPath}/${type}s/index.ts`;
    }
  } else {
    if (type === 'state') {
      barrelIndexPath = `${prefix}/features${srcSubFolderPath}/${featureName}/index.ts`;
    } else {
      barrelIndexPath = `${prefix}/features${srcSubFolderPath}/${featureName}/${type}s/index.ts`;
    }
  }

  if (type === 'state') {
    return adjustBarrelIndexForType(type, options, barrelIndexPath);
  } else {
    return adjustBarrelIndex(type, options, barrelIndexPath);
  }
}

export function adjustBarrelIndex(
  type: IGenerateType,
  options: IGenerateOptions,
  indexFilePath: string,
  inSubFolder?: boolean,
  isBase?: boolean,
  importIfSubFolder?: boolean
): Rule {
  return (host: Tree, context: SchematicContext) => {
    const devKitTree = convertNgTreeToDevKit(host, context);
    // console.log('adjustBarrelIndex:', indexFilePath);
    // console.log('host.exists(indexFilePath):', host.exists(indexFilePath));
    if (host.exists(indexFilePath)) {
      const indexSource = host.read(indexFilePath)!.toString('utf-8');
      let indexSourceFile = ts.createSourceFile(
        indexFilePath,
        indexSource,
        ts.ScriptTarget.Latest,
        true
      );

      const changes = [];
      const name = options.name.toLowerCase();

      if (!isBase && type !== 'service') {
        // add to barrel collection
        if (importIfSubFolder && options.subFolder) {
          // import collection from subfolder
          const symbolName = `${stringUtils
            .sanitize(options.subFolder)
            .toUpperCase()}_${type.toUpperCase()}S`;
          indexSourceFile = addGlobal(
            devKitTree,
            indexSourceFile,
            indexFilePath,
            `import { ${symbolName} } from './${options.subFolder}';`,
            false
          );
          indexSourceFile = addToCollection(
            devKitTree,
            indexSourceFile,
            indexFilePath,
            `...${symbolName}`,
            '  '
          );
          changes.push(indexSourceFile);
        } else {
          const symbolName = `${stringUtils.classify(
            name
          )}${stringUtils.capitalize(type)}`;
          indexSourceFile = addGlobal(
            devKitTree,
            indexSourceFile,
            indexFilePath,
            `import { ${symbolName} } from './${
              inSubFolder ? `${name}/` : ''
            }${name}.${type}';`
          );
          indexSourceFile = addToCollection(
            devKitTree,
            indexSourceFile,
            indexFilePath,
            symbolName,
            '  '
          )
          changes.push(
            indexSourceFile
          );
        }
      }

      if (type === 'component' || type === 'service' || type === 'pipe') {
        // export symbol from barrel
        if ((isBase || importIfSubFolder) && options.subFolder) {
          indexSourceFile = addGlobal(
            devKitTree,
            indexSourceFile,
            indexFilePath,
            `export * from './${options.subFolder}';`,
            true
          );
          changes.push(
            indexSourceFile
          );
        } else {
          const subFolder = inSubFolder ? `${name}/` : '';
          indexSourceFile = addGlobal(
            devKitTree,
            indexSourceFile,
            indexFilePath,
            `export * from './${subFolder}${name}.${
              isBase ? 'base-' : ''
            }${type}';`,
            true
          );
          changes.push(
            indexSourceFile
          );
        }
      }

      // insert(devKitTree.tree, indexFilePath, changes);
    } else {
      options.needsIndex = true;
    }
    return devKitTree.tree;
  };
}

export function adjustBarrelIndexForType(
  type: IGenerateType,
  options: IGenerateOptions,
  indexFilePath: string
): Rule {
  return (host: Tree, context) => {
    const devKitTree = convertNgTreeToDevKit(host, context);
    if (host.exists(indexFilePath)) {
      const indexSource = host.read(indexFilePath)!.toString('utf-8');
      const indexSourceFile = ts.createSourceFile(
        indexFilePath,
        indexSource,
        ts.ScriptTarget.Latest,
        true
      );

      const changes = [];

      changes.push(
        addGlobal(
          devKitTree,
          indexSourceFile,
          indexFilePath,
          `export * from './${type}';`,
          true
        )
      );
      // insert(devKitTree.tree, indexFilePath, changes);
    } else {
      options.needsIndex = true;
    }
    return devKitTree.tree;
  };
}

export function adjustModule(
  tree: Tree,
  type: IGenerateType,
  options: IGenerateOptions,
  prefixPath: string
) {
  let featureName: string = getFeatureName(options);
  const isNxLib = XplatHelpers.isFeatureNxLib(featureName);
  let featurePath: string;
  if (isNxLib) {
    featurePath = getNxFeaturePath(tree, featureName);
    featureName = featureName.split('/').pop();
  } else if (shouldTargetCoreBarrel(type, featureName)) {
    featureName = 'core';
    featurePath = `${prefixPath}/${featureName}/src/lib`;
  } else {
    featurePath = `${prefixPath}/features/src/lib/${featureName}`;
  }

  const featureModulePath = `${featurePath}/${featureName}.module.ts`;
  if (type === 'state') {
    return adjustFeatureModuleForState(options, featureModulePath);
  } else {
    return adjustFeatureModule(type, options, featureModulePath);
  }
}

export function adjustFeatureModule(
  type: IGenerateType,
  options: IGenerateOptions,
  modulePath: string
): Rule {
  return (host: Tree, context) => {
    const devKitTree = convertNgTreeToDevKit(host, context);
    // console.log('adjustFeatureModule:', modulePath);
    if (host.exists(modulePath)) {
      const moduleSource = host.read(modulePath)!.toString('utf-8');
      const moduleSourceFile = getTsSourceFile(devKitTree, modulePath);

      const changes = [];
      let featureName: string;
      if (options.feature) {
        featureName = stringUtils.sanitize(options.feature).toUpperCase();
      } else {
        // default collections
        if (type === 'service') {
          featureName = 'CORE';
        } else {
          if (modulePath.indexOf('apps') > -1) {
            // app specific shared
            featureName = 'SHARED';
          } else {
            // workspace cross platform ui libraries
            featureName = 'UI';
          }
        }
      }
      let collectionName: string;

      switch (type) {
        case 'component':
          collectionName = `${featureName}_COMPONENTS`;
          break;
        case 'directive':
          collectionName = `${featureName}_DIRECTIVES`;
          break;
        case 'pipe':
          collectionName = `${featureName}_PIPES`;
          break;
        case 'service':
          collectionName = `${featureName}_PROVIDERS`;
          break;
      }
      // console.log('collectionName:', collectionName);
      // console.log('moduleSource:', moduleSource);

      if (moduleSource.indexOf(collectionName) > -1) {
        // already handled
        return host;
      } else {
        if (type !== 'service') {
          // add to module
          changes.push(
            _addSymbolToNgModuleMetadata(
              devKitTree,
              addDeclarationToModule(
                devKitTree,
                addGlobal(
                  devKitTree,
                  moduleSourceFile,
                  modulePath,
                  `import { ${collectionName} } from './${type}s';`
                ),
                modulePath,
                `...${collectionName}`
              ),
              modulePath,
              'exports',
              `...${collectionName}`
            )
          );
        }

        // insert(devKitTree.tree, modulePath, changes);
      }
    }
    return devKitTree.tree;
  };
}

export function adjustFeatureModuleForState(
  options: IGenerateOptions,
  modulePath: string
): Rule {
  return (host: Tree, context) => {
    const devKitTree = convertNgTreeToDevKit(host, context);
    // console.log('adjustFeatureModuleForState:', modulePath);
    if (host.exists(modulePath)) {
      const moduleSource = host.read(modulePath)!.toString('utf-8');
      let moduleSourceFile = ts.createSourceFile(
        modulePath,
        moduleSource,
        ts.ScriptTarget.Latest,
        true
      );
      // console.log('moduleSource:', moduleSource);

      const isInLibs = modulePath.indexOf('libs/xplat/core') === 0;
      const name = options.name.toLowerCase();
      const changes = [];
      if (moduleSource.indexOf('StoreModule') === -1) {
        moduleSourceFile = addGlobal(
          devKitTree,
          moduleSourceFile,
          modulePath,
          `import { StoreModule } from '@ngrx/store';`
        );
        changes.push(moduleSourceFile);
      }
      if (moduleSource.indexOf('EffectsModule') === -1) {
        moduleSourceFile = addGlobal(
          devKitTree,
          moduleSourceFile,
          modulePath,
          `import { EffectsModule } from '@ngrx/effects';`
        );
        changes.push(moduleSourceFile);
      }
      moduleSourceFile = addGlobal(
        devKitTree,
        moduleSourceFile,
        modulePath,
        `import { ${stringUtils.classify(
          name
        )}Effects } from './state/${name}.effects';`
      );
      moduleSourceFile = addGlobal(
        devKitTree,
        moduleSourceFile,
        modulePath,
        `import { ${stringUtils.camelize(
          name
        )}Reducer } from './state/${name}.reducer';`
      );

      moduleSourceFile = addGlobal(
        devKitTree,
        moduleSourceFile,
        modulePath,
        `import { ${stringUtils.classify(
          name
        )}State } from './state/${name}.state';`
      );

      changes.push(moduleSourceFile);

      if (options.root) {
        if (moduleSource.indexOf('environments/environment') === -1) {
          const envFrom = isInLibs
            ? './environments/environment'
            : `@${getNpmScope()}/xplat/core`;
          moduleSourceFile = addGlobal(
            devKitTree,
            moduleSourceFile,
            modulePath,
            `import { environment } from '${envFrom}';`
          );
          changes.push(moduleSourceFile);
        }

        moduleSourceFile = addImportToModule(
          devKitTree,
          moduleSourceFile,
          modulePath,
          `StoreModule.forRoot(
    { ${stringUtils.camelize(name)}: ${stringUtils.camelize(name)}Reducer },
    {
      initialState: { ${stringUtils.camelize(name)}: ${stringUtils.classify(
            name
          )}State.initialState }
    }
  ), EffectsModule.forRoot([${stringUtils.classify(name)}Effects])`
        );

        moduleSourceFile = addProviderToModule(
          devKitTree,
          moduleSourceFile,
          modulePath,
          `${stringUtils.classify(name)}Effects`
        );

        changes.push(moduleSourceFile);
      } else {
        moduleSourceFile = addImportToModule(
          devKitTree,
          moduleSourceFile,
          modulePath,
          `StoreModule.forFeature('${stringUtils.camelize(
            name
          )}', ${stringUtils.camelize(
            name
          )}Reducer, { initialState: ${stringUtils.classify(
            name
          )}State.initialState }), EffectsModule.forFeature([${stringUtils.classify(
            name
          )}Effects])`
        );
        moduleSourceFile = addProviderToModule(
          devKitTree,
          moduleSourceFile,
          modulePath,
          `${stringUtils.classify(name)}Effects`
        );
        // feature state
        changes.push(moduleSourceFile);
      }

      // insert(devKitTree.tree, modulePath, changes);
    }
    return devKitTree.tree;
  };
}

export function adjustRouting(
  options: XplatFeatureHelpers.Schema,
  routingModulePaths: Array<string>,
  platform: string
): Rule {
  return (host: Tree, context) => {
    const devKitTree = convertNgTreeToDevKit(host, context);
    const featureName = options.name.toLowerCase();
    let routingModulePath: string;
    // check which routing naming convention might be in use
    // app.routing.ts or app-routing.module.ts
    for (const modulePath of routingModulePaths) {
      if (host.exists(modulePath)) {
        routingModulePath = modulePath;
        break;
      }
    }
    // console.log('routingModulePath:',routingModulePath);
    // console.log('host.exists(routingModulePath):',host.exists(routingModulePath));
    if (routingModulePath) {
      const routingSource = host.read(routingModulePath)!.toString('utf-8');
      const routingSourceFile = ts.createSourceFile(
        routingModulePath,
        routingSource,
        ts.ScriptTarget.Latest,
        true
      );

      const changes = [];

      // add component to route config
      changes.push(
        addToCollection(
          devKitTree,
          routingSourceFile,
          routingModulePath,
          `{ 
              path: '${featureName}',
              loadChildren: () => import('./features/${
                options.directory ? options.directory + '/' : ''
              }${featureName}/${featureName}.module').then(m => m.${stringUtils.classify(
            featureName
          )}Module)
          }`
        )
      );

      // insert(devKitTree.tree, routingModulePath, changes);
    }
    return devKitTree.tree;
  };
}

export function adjustSandbox(
  options: XplatFeatureHelpers.Schema,
  platform: PlatformTypes,
  appDirectory: string
): Rule {
  return (tree: Tree) => {
    if (supportedSandboxPlatforms.includes(platform)) {
      const homeCmpPath = `${appDirectory}/features/home/components/home.component.html`;
      let homeTemplate = tree.get(homeCmpPath).content.toString();
      switch (platform) {
        case 'nativescript':
          let buttonTag = 'Button';
          let buttonEndIndex = homeTemplate.lastIndexOf(`</${buttonTag}>`);
          if (buttonEndIndex === -1) {
            // check for lowercase
            buttonEndIndex = homeTemplate.lastIndexOf(
              `</${buttonTag.toLowerCase()}>`
            );
            if (buttonEndIndex > -1) {
              buttonTag = buttonTag.toLowerCase();
            }
          }

          let customBtnClass = '';

          if (buttonEndIndex === -1) {
            // if no buttons were found this is a fresh sandbox app setup
            // it should have a label as placeholder
            buttonEndIndex = homeTemplate.lastIndexOf('</Label>');
            if (buttonEndIndex === -1) {
              buttonEndIndex = homeTemplate.lastIndexOf(`</label>`);
            }
          } else {
            const buttonClassStartIndex =
              homeTemplate.lastIndexOf('class="btn ');
            if (buttonClassStartIndex > -1) {
              // using custom button class
              customBtnClass =
                ' ' +
                homeTemplate.substring(
                  buttonClassStartIndex + 11,
                  homeTemplate.lastIndexOf(`"></${buttonTag}>`)
                );
            }
          }

          const featureName = options.name.toLowerCase();
          const featureNameParts = featureName.split('-');
          let routeName = featureName;
          if (featureNameParts.length > 1) {
            routeName = stringUtils.capitalize(
              featureNameParts[featureNameParts.length - 1]
            );
          }
          homeTemplate =
            homeTemplate.slice(0, buttonEndIndex + 9) +
            `<${buttonTag} text="${routeName}" (tap)="goTo('/${featureName}')" class="btn${customBtnClass}"></${buttonTag}>` +
            homeTemplate.slice(buttonEndIndex + 9);
          break;
      }
      updateFile(tree, homeCmpPath, homeTemplate);
    } else {
      throw new SchematicsException(
        `The --adjustSandbox option is only supported on the following at the moment: ${supportedSandboxPlatforms}`
      );
    }
    return tree;
  };
}
