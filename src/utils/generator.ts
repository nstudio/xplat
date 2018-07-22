import {
  apply,
  url,
  move,
  template,
  mergeWith,
  TemplateOptions,
  branchAndMerge,
  chain,
  noop,
  SchematicContext,
  Tree,
  Rule
} from '@angular-devkit/schematics';
import {
  addGlobal,
  insert,
  addToCollection,
  addImportToModule,
  addProviderToModule,
  addDeclarationToModule,
  _addSymbolToNgModuleMetadata
} from './ast';
import {
  generateOptionError,
  unsupportedPlatformError,
  needFeatureModuleError
} from './errors';
import {
  supportedPlatforms,
  ITargetPlatforms,
  prerun,
  getNpmScope,
  getPrefix,
  stringUtils,
  updatePackageForNgrx,
} from './general';
import * as ts from 'typescript';
import { formatFiles } from './format-files';

export type IGenerateType = 'component' | 'directive' | 'pipe' | 'service' | 'state';

export interface IGenerateOptions {
  name: string;
  feature?: string;
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
    let platforms: Array<string> = [];

    if (options.projects) {
      // building in projects
      for (const name of options.projects.split(',')) {
        const platPrefix = name.split('-')[0];
        if (
          supportedPlatforms.includes(platPrefix) &&
          !platforms.includes(platPrefix)
        ) {
          // if project name is prefixed with supported platform and not already added
          platforms.push(platPrefix);
        }
      }
    } else if (options.platforms) {
      // building in shared code only
      platforms = options.platforms.split(',');
    }
    const targetPlatforms: ITargetPlatforms = {};
    for (const t of platforms) {
      if (supportedPlatforms.includes(t)) {
        targetPlatforms[t] = true;
      } else {
        throw new Error(unsupportedPlatformError(t));
      }
    }

    const projectChains = [];
    if (options.projects) {
      for (const projectName of options.projects.split(',')) {
        const platPrefix = projectName.split('-')[0];
        let srcDir = platPrefix !== 'nativescript' ? 'src/' : '';
        const prefixPath = `apps/${projectName}/${srcDir}app`;

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
          return addToFeature(type, options, prefixPath, tree)(tree, context);
        });

        if (type === 'state') {
          // ngrx handling
          projectChains.push((tree: Tree, context: SchematicContext) => {
            return adjustBarrelIndexForType(type, options, barrelIndex)(tree, context);
          });
          projectChains.push((tree: Tree, context: SchematicContext) => {
            return addToFeature(type, options, prefixPath, tree, '_index')(
              tree,
              context
            );
          });
          projectChains.push((tree: Tree, context: SchematicContext) => {
            return adjustFeatureModuleForState(options, featureModulePath)(
              tree,
              context
            );
          });
          projectChains.push((tree: Tree, context: SchematicContext) => {
            return updatePackageForNgrx(tree, `apps/${projectName}/package.json`);
          });
        } else {
          projectChains.push((tree: Tree, context: SchematicContext) => {
            return adjustBarrelIndex(type, options, barrelIndex)(tree, context);
          });
          projectChains.push((tree: Tree, context: SchematicContext) => {
            return addToFeature(type, options, prefixPath, tree, '_index')(
              tree,
              context
            );
          });
          projectChains.push((tree: Tree, context: SchematicContext) => {
            return adjustFeatureModule(type, options, featureModulePath)(
              tree,
              context
            );
          });
        }
      }
    } else {
      projectChains.push(noop());
    }

    return chain([
      prerun(),
      (tree: Tree, context: SchematicContext) =>
        // for entire workspace usage
        // no projects and no specific platforms specified
        !options.projects && platforms.length === 0
          ? addToFeature(type, options, 'libs', tree)(tree, context)
          : noop()(tree, context),
      // adjust libs barrel
      (tree: Tree, context: SchematicContext) => 
        !options.projects && platforms.length === 0
          ? adjustBarrel(type, options, 'libs')(tree, context)
          : noop()(tree, context),
      // add index barrel if needed
      (tree: Tree, context: SchematicContext) =>
        options.needsIndex
          ? addToFeature(type, options, 'libs', tree, '_index')(tree, context)
          : noop()(tree, context),
      // adjust feature module metadata if needed
      (tree: Tree, context: SchematicContext) => 
        !options.projects && platforms.length === 0
          ? adjustModule(type, options, 'libs')(tree, context)
          : noop()(tree, context),
      // add for {N}
      (tree: Tree, context: SchematicContext) =>
        !options.projects && targetPlatforms.nativescript
          ? addToFeature(type, options, 'xplat/nativescript', tree)(
              tree,
              context
            )
          : noop()(tree, context),
      // adjust {N} barrel
      (tree: Tree, context: SchematicContext) =>
        !options.projects && targetPlatforms.nativescript
          ? adjustBarrel(type, options, 'xplat/nativescript')(tree, context)
          : noop()(tree, context),
      // add index barrel if needed
      (tree: Tree, context: SchematicContext) =>
        options.needsIndex
          ? addToFeature(type, options, 'xplat/nativescript', tree, '_index')(
              tree,
              context
            )
          : noop()(tree, context),
      // adjust feature module metadata if needed
      (tree: Tree, context: SchematicContext) => 
        !options.projects && targetPlatforms.nativescript
          ? adjustModule(type, options, 'xplat/nativescript')(tree, context)
          : noop()(tree, context),
      // add for web
      (tree: Tree, context: SchematicContext) =>
        !options.projects && targetPlatforms.web
          ? addToFeature(type, options, 'xplat/web', tree)(tree, context)
          : noop()(tree, context),
      // adjust web barrel
      (tree: Tree, context: SchematicContext) =>
        !options.projects && targetPlatforms.web
          ? adjustBarrel(type, options, 'xplat/web')(tree, context)
          : noop()(tree, context),
      // add index barrel if needed
      (tree: Tree, context: SchematicContext) =>
        options.needsIndex
          ? addToFeature(type, options, 'xplat/web', tree, '_index')(
              tree,
              context
            )
          : noop()(tree, context),
      // adjust feature module metadata if needed
      (tree: Tree, context: SchematicContext) => 
        !options.projects && targetPlatforms.nativescript
          ? adjustModule(type, options, 'xplat/web')(tree, context)
          : noop()(tree, context),
      // add for ionic
      (tree: Tree, context: SchematicContext) =>
        !options.projects && targetPlatforms.ionic
          ? addToFeature(type, options, 'xplat/ionic', tree)(tree, context)
          : noop()(tree, context),
      // adjust ionic barrel
      (tree: Tree, context: SchematicContext) =>
        !options.projects && targetPlatforms.ionic
          ? adjustBarrel(type, options, 'xplat/ionic')(tree, context)
          : noop()(tree, context),
      // add index barrel if needed
      (tree: Tree, context: SchematicContext) =>
        options.needsIndex
          ? addToFeature(type, options, 'xplat/ionic', tree, '_index')(
              tree,
              context
            )
          : noop()(tree, context),
      // adjust feature module metadata if needed
      (tree: Tree, context: SchematicContext) => 
        !options.projects && targetPlatforms.nativescript
          ? adjustModule(type, options, 'xplat/ionic')(tree, context)
          : noop()(tree, context),
      // project handling
      ...projectChains,
      // dependency updates
      (tree: Tree, context: SchematicContext) => 
        !options.projects && type === 'state'
          // ensure ngrx dependencies are added to root package
          ? updatePackageForNgrx(tree)
          : noop()(tree, context),
       formatFiles(options)
    ]);
}

export function getFeatureName(options: IGenerateOptions) {
  let featureName: string;
  if (options.feature) {
    featureName = options.feature.toLowerCase();
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

export function addToFeature(
  type: IGenerateType,
  options: IGenerateOptions,
  prefixPath: string,
  tree: Tree,
  extra: string = ''
) {
  let featureName: string = getFeatureName(options);

  options.needsIndex = false; // reset

  let featurePath: string;
  if (shouldTargetCoreBarrel(type, featureName)) {
    // services and/or state should never be generated in shared or ui features
    // therefore place in core (since they are service level)
    featureName = 'core';
    featurePath = `${prefixPath}/${featureName}`;
  } else {
    featurePath = `${prefixPath}/features/${featureName}`;
  }

  const featureModulePath = `${featurePath}/${featureName}.module.ts`;
  let moveTo: string;
  if (extra === '_base') {
    // always in libs
    moveTo = `libs/features/${featureName}/base`;
  } else {
    moveTo = `${featurePath}/${type}${type === 'state' ? '' : 's'}`;
    if (!tree.exists(featureModulePath)) {
      let optionName: string;
      if (prefixPath !== 'libs') {
        // parse platform from prefix
        const parts = prefixPath.split('/');
        if (parts.length > 1) {
          optionName = parts[1];
        }
      }
      throw new Error(
        needFeatureModuleError(featureModulePath, featureName, optionName)
      );
    }
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
          template(<TemplateOptions>{
            ...(options as any),
            name: options.name.toLowerCase(),
            npmScope: getNpmScope(),
            prefix: getPrefix(),
            dot: '.',
            utils: stringUtils
          }),
          move(moveTo)
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

export function shouldTargetCoreBarrel(type: IGenerateType, featureName: string) {
  // when service or state is being generated with no options, it falls back to shared/ui
  // services and state should never be generated in shared or ui features
  // therefore target core barrel
  return (type === 'service' || type === 'state') && isFeatureInGeneralBarrel(featureName);
}

export function adjustBarrel(type: IGenerateType, options: IGenerateOptions, prefix: string) {
  let featureName: string = getFeatureName(options);
  let barrelIndexPath: string;
  if (shouldTargetCoreBarrel(type, featureName)) {
    if (type === 'state') {
      barrelIndexPath = `${prefix}/core/index.ts`;
    } else {
      barrelIndexPath = `${prefix}/core/${type}s/index.ts`;
    }
  } else {
    if (type === 'state') {
      barrelIndexPath = `${prefix}/features/${featureName}/index.ts`;
    } else {
      barrelIndexPath = `${prefix}/features/${featureName}/${type}s/index.ts`;
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
  isBase?: boolean
): Rule {
  return (host: Tree) => {
    if (host.exists(indexFilePath)) {
      const indexSource = host.read(indexFilePath)!.toString('utf-8');
      const indexSourceFile = ts.createSourceFile(
        indexFilePath,
        indexSource,
        ts.ScriptTarget.Latest,
        true
      );

      const changes = [];
      const name = options.name.toLowerCase();

      if (!isBase) {
        // add to barrel collection
        changes.push(
          ...addGlobal(
            indexSourceFile,
            indexFilePath,
            `import { ${stringUtils.classify(name)}${stringUtils.capitalize(
              type
            )} } from './${inSubFolder ? `${name}/` : ''}${name}.${type}';`
          ),
          ...addToCollection(
            indexSourceFile,
            indexFilePath,
            `${stringUtils.classify(name)}${stringUtils.capitalize(type)}`,
            '  '
          )
        );
      }

      if (type === 'component' || type === 'service') {
        // export symbol from barrel
        const subFolder = inSubFolder ? `${name}/` : '';
        changes.push(
          ...addGlobal(
            indexSourceFile,
            indexFilePath,
            `export * from './${subFolder}${name}.${
              isBase ? 'base-' : ''
            }${type}';`,
            true
          )
        );
      }

      insert(host, indexFilePath, changes);
    } else {
      options.needsIndex = true;
    }
    return host;
  };
}

export function adjustBarrelIndexForType(
  type: IGenerateType,
  options: IGenerateOptions,
  indexFilePath: string,
): Rule {
  return (host: Tree) => {
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
        ...addGlobal(
          indexSourceFile,
          indexFilePath,
          `export * from './${type}';`,
          true
        )
      );
      insert(host, indexFilePath, changes);
    } else {
      options.needsIndex = true;
    }
    return host;
  };
}

export function adjustModule(
  type: IGenerateType,
  options: IGenerateOptions,
  prefixPath: string
) {
  let featureName: string = getFeatureName(options);
  let featurePath: string;
  if (shouldTargetCoreBarrel(type, featureName)) {
    featureName = 'core';
    featurePath = `${prefixPath}/${featureName}`;
  } else {
    featurePath = `${prefixPath}/features/${featureName}`;
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
  return (host: Tree) => {
    // console.log('adjustFeatureModule:', modulePath);
    if (host.exists(modulePath)) {
      const moduleSource = host.read(modulePath)!.toString('utf-8');
      const moduleSourceFile = ts.createSourceFile(
        modulePath,
        moduleSource,
        ts.ScriptTarget.Latest,
        true
      );

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
        // add to module
        changes.push(
          ...addGlobal(
            moduleSourceFile,
            modulePath,
            `import { ${collectionName} } from './${type}s';`
          )
        );

        if (type === 'service') {
          changes.push(
            ...addProviderToModule(
              moduleSourceFile,
              modulePath,
              `...${collectionName}`
            )
          );
        } else {
          changes.push(
            ...addDeclarationToModule(
              moduleSourceFile,
              modulePath,
              `...${collectionName}`
            ),
            ..._addSymbolToNgModuleMetadata(
              moduleSourceFile,
              modulePath,
              'exports',
              `...${collectionName}`
            )
          );
        }

        insert(host, modulePath, changes);
      }
    }
    return host;
  };
}

export function adjustFeatureModuleForState(
  options: IGenerateOptions,
  modulePath: string
): Rule {
  return (host: Tree) => {
    // console.log('adjustFeatureModuleForState:', modulePath);
    if (host.exists(modulePath)) {
      const moduleSource = host.read(modulePath)!.toString('utf-8');
      const moduleSourceFile = ts.createSourceFile(
        modulePath,
        moduleSource,
        ts.ScriptTarget.Latest,
        true
      );
      // console.log('moduleSource:', moduleSource);

      const isInLibs = modulePath.indexOf('libs') === 0;
      const name = options.name.toLowerCase();
      const changes = [];
      if (moduleSource.indexOf('StoreModule') === -1) {
        changes.push(
          ...addGlobal(
            moduleSourceFile,
            modulePath,
            `import { StoreModule } from '@ngrx/store';`
          )
        );
      }
      if (moduleSource.indexOf('EffectsModule') === -1) {
        changes.push(
          ...addGlobal(
            moduleSourceFile,
            modulePath,
            `import { EffectsModule } from '@ngrx/effects';`
          )
        );
      }
      if (moduleSource.indexOf('ngrx-store-freeze') === -1) {
        changes.push(
          ...addGlobal(
            moduleSourceFile,
            modulePath,
            `import { storeFreeze } from 'ngrx-store-freeze';`
          )
        );
      }

      changes.push(
        ...addGlobal(
          moduleSourceFile,
          modulePath,
          `import { ${stringUtils.classify(name)}Effects } from './state/${name}.effects';`
        ),
        ...addGlobal(
          moduleSourceFile,
          modulePath,
          `import { ${name}Reducer } from './state/${name}.reducer';`
        ),
        ...addGlobal(
          moduleSourceFile,
          modulePath,
          `import { ${stringUtils.classify(name)}State } from './state/${name}.state';`
        )
      );

      
      if (options.root) {
        if (moduleSource.indexOf('environments/environment') === -1) {
          const envFrom = isInLibs ? './environments/environment' : `@${getNpmScope()}/core`;
          changes.push(
            ...addGlobal(
              moduleSourceFile,
              modulePath,
              `import { environment } from '${envFrom}';`
            )
          );
        }
        
        changes.push(
          ...addImportToModule(
            moduleSourceFile,
            modulePath,
            `StoreModule.forRoot(
      { ${name}: ${name}Reducer },
      {
        initialState: { ${name}: ${stringUtils.classify(name)}State.initialState },
        metaReducers: !environment.production ? [storeFreeze] : []
      }
    )`
          ),
          ...addImportToModule(
            moduleSourceFile,
            modulePath,
            `EffectsModule.forRoot([${stringUtils.classify(name)}Effects])`
          ),
          ...addProviderToModule(
            moduleSourceFile,
            modulePath,
            `${stringUtils.classify(name)}Effects`
          )
        );
      } else {
        // feature state
        changes.push(
          ...addImportToModule(
            moduleSourceFile,
            modulePath,
            `StoreModule.forFeature('${name}', ${name}Reducer, { initialState: ${stringUtils.classify(name)}State.initialState })`
          ),
          ...addImportToModule(
            moduleSourceFile,
            modulePath,
            `EffectsModule.forFeature([${stringUtils.classify(name)}Effects])`
          ),
          ...addProviderToModule(
            moduleSourceFile,
            modulePath,
            `${stringUtils.classify(name)}Effects`
          )
        );
      }

      insert(host, modulePath, changes);
    }
    return host;
  };
}
