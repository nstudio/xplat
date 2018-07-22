import {
  chain,
  Rule,
  SchematicContext,
  Tree,
  noop
} from "@angular-devkit/schematics";

import { getJsonFromFile, updateJsonFile, createOrUpdate, updateJsonInTree, readJsonInTree } from '../../utils';
import { addTestingFiles } from '../../xplat';

function updateNativeScriptApps(tree: Tree, context: SchematicContext) {
  const angularConfigPath = `angular.json`;
  const nxConfigPath = `nx.json`;

  const angularJson = getJsonFromFile(tree, angularConfigPath);
  const nxJson = getJsonFromFile(tree, nxConfigPath);
  const prefix = getPrefix(tree);

  const npmScope = nxJson.npmScope;
  const appsDir = tree.getDir("apps");
  const appFolders = appsDir.subdirs;
  // console.log("npmScope:", npmScope);
  // console.log("prefix:", prefix);

  // update libs and xplat config
  if (angularJson && angularJson.projects) {
    angularJson.projects['libs'] = {
      "root": "libs",
      "sourceRoot": "libs",
      "projectType": "library",
      "prefix": prefix,
      "architect": {
        "test": {
          "builder": "@angular-devkit/build-angular:karma",
          "options": {
            "main": "testing/test.libs.ts",
            "tsConfig": "testing/tsconfig.libs.spec.json",
            "karmaConfig": "testing/karma.conf.js"
          }
        },
        "lint": {
          "builder": "@angular-devkit/build-angular:tslint",
          "options": {
            "tsConfig": [
              "testing/tsconfig.libs.json",
              "testing/tsconfig.libs.spec.json"
            ],
            "exclude": [
              "**/node_modules/**"
            ]
          }
        }
      }
    };
    angularJson.projects['xplat'] = {
      "root": "xplat",
      "sourceRoot": "xplat",
      "projectType": "library",
      "prefix": prefix,
      "architect": {
        "test": {
          "builder": "@angular-devkit/build-angular:karma",
          "options": {
            "main": "testing/test.xplat.ts",
            "tsConfig": "testing/tsconfig.xplat.spec.json",
            "karmaConfig": "testing/karma.conf.js"
          }
        },
        "lint": {
          "builder": "@angular-devkit/build-angular:tslint",
          "options": {
            "tsConfig": [
              "testing/tsconfig.xplat.json",
              "testing/tsconfig.xplat.spec.json"
            ],
            "exclude": [
              "**/node_modules/**"
            ]
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

  // update {N} apps and configs
  for (const dir of appFolders) {
    // console.log(dir);
    if (dir.indexOf("nativescript-") === 0) {
      const appDir = `${appsDir.path}/${dir}`;
      // console.log('appDir:', appDir);

      if (angularJson && angularJson.projects) {
        angularJson.projects[dir] = {
          root: `apps/${dir}/`,
          sourceRoot: `apps/${dir}/app`,
          projectType: "application",
          prefix,
          schematics: {
            "@schematics/angular:component": {
              styleext: "scss"
            }
          }
        };
      }

      if (nxJson && nxJson.projects) {
        nxJson.projects[dir] = {
          tags: []
        };
      }

      createOrUpdate(
        tree,
        `${appDir}/tsconfig.esm.json`,
        getTsConfigESM()
      );
      createOrUpdate(
        tree,
        `${appDir}/webpack.config.js`,
        getWebpackConfig()
      );
      createOrUpdate(
        tree,
        `${appDir}/tools/xplat-before-watch.js`,
        getxPlatBeforeWatch(npmScope)
      );
      createOrUpdate(
        tree,
        `${appDir}/tools/xplat-postinstall.js`,
        getxPlatPostinstall()
      );

      // update {N} app deps
      const packagePath = `${appDir}/package.json`

      const packageJson = getJsonFromFile(tree, packagePath);

      if (packageJson) {

        packageJson.scripts = {
          ...packageJson.scripts,
          "postinstall": "node ./tools/xplat-postinstall.js",
        };
        packageJson.dependencies = packageJson.dependencies || {};
        packageJson.devDependencies = packageJson.devDependencies || {};
        packageJson.devDependencies = {
          ...packageJson.devDependencies,
          "@ngtools/webpack": "~6.0.3",
          "clean-webpack-plugin": "~0.1.19",
          "copy-webpack-plugin": "~4.5.1",
          "css-loader": "~0.28.11",
          "extract-text-webpack-plugin": "~3.0.2",
          "nativescript-css-loader": "~0.26.0",
          "nativescript-dev-typescript": "~0.7.0",
          "nativescript-dev-webpack": "~0.13.0",
          "nativescript-worker-loader": "~0.9.0",
          "raw-loader": "~0.5.1",
          "resolve-url-loader": "~2.3.0",
          "sass-loader": "^7.0.2",
          "uglifyjs-webpack-plugin": "~1.2.5",
          "webpack": "~4.6.0",
          "webpack-bundle-analyzer": "~2.13.0",
          "webpack-cli": "~2.1.3",
          "webpack-sources": "~1.1.0"
        };
        // ensure dev sass is removed
        delete packageJson.devDependencies['nativescript-dev-sass'];

        // console.log('path:',path);
        // console.log('packageJson overwrite:', JSON.stringify(packageJson));
        tree = updateJsonFile(tree, packagePath, packageJson);
      }

      try {
        // cleanup
        tree.delete(`${appDir}/tsconfig.aot.json`);
        tree.delete(`${appDir}/app/vendor-platform.android.ts`);
        tree.delete(`${appDir}/app/vendor-platform.ios.ts`);
        tree.delete(`${appDir}/app/vendor.ts`);
        tree.delete(`${appDir}/tools/app-before-watch.js`);
        tree.delete(`${appDir}/tools/app-postinstall.js`);
      } catch (err) {}
    }
  }
  tree = updateJsonFile(tree, angularConfigPath, angularJson);
  tree = updateJsonFile(tree, nxConfigPath, nxJson);
  return tree;
}

function updateRootPackage(tree: Tree, context: SchematicContext) {
  return updateJsonInTree("package.json", json => {
    json.scripts = json.scripts || {};
    json.dependencies = json.dependencies || {};
    json.devDependencies = json.devDependencies || {};
  
    const appsDir = tree.getDir("apps");
    const appFolders = appsDir.subdirs;

    for (const dir of appFolders) {
      if (dir.indexOf("nativescript-") === 0) {
        const parts = dir.split('-');
        const appName = parts[1];
        json.scripts[`start.nativescript.${appName}.ios`] = `cd apps/${dir} && tns run ios --emulator --bundle`;
        json.scripts[`start.nativescript.${appName}.android`] = `cd apps/${dir} && tns run android --emulator --bundle`;
        json.scripts[`clean.nativescript.${appName}`] = `cd apps/${dir} && npx rimraf -- hooks node_modules platforms package-lock.json && npm i`;
      }
    }
  
    json.dependencies = {
      ...json.dependencies,
      "nativescript-angular": "~6.0.0",
      "tns-core-modules": "~4.1.0"
    };
    json.devDependencies = {
      ...json.devDependencies,
      "tns-platform-declarations": "~4.1.0"
    };
  
    return json;
  })(tree, context);
}

function getPrefix(host: Tree) {
  const packageJson = readJsonInTree(host, "package.json");
  let prefix = '';
  if (packageJson.xplat && packageJson.xplat.prefix) {
    prefix = packageJson.xplat.prefix;
  }
  if (!prefix) {
    const angularJson = readJsonInTree(host, "angular.json");
    for (const key in angularJson.projects) {
      const project = angularJson.projects[key];
      if (project.projectType === "application" && !project.architect.e2e) {
        prefix = project.prefix;
        break;
      }
    }
  }
  return prefix;
}

function updateLint(host: Tree, context: SchematicContext) {
  const prefix = getPrefix(host);

  return updateJsonInTree("tslint.json", json => {
    json.rules = json.rules || {};
    // remove forin rule as collides with LogService
    delete json.rules['forin'];
    // adjust console rules to work with LogService
    json.rules['no-console'] = [
      true,
      "debug",
      "time",
      "timeEnd",
      "trace"
    ];
    json.rules['directive-selector'] = [
      true,
      "attribute",
      prefix,
      "camelCase"
    ];
    json.rules['component-selector'] = [
      true,
      "element",
      prefix,
      "kebab-case"
    ];
  
    return json;
  })(host, context);
}

export default function(): Rule {
  return chain([
    updateNativeScriptApps,
    // add testing files if needed
    (tree: Tree, context: SchematicContext) => {
      if (!tree.exists('testing/karma.conf.js')) {
        return addTestingFiles(tree, {}, '../../xplat/')(tree, context);
      } else {
        return noop()(tree, context);
      }
    },
    updateRootPackage,
    updateLint,
  ]);
}

function getxPlatBeforeWatch(npmScope: string) {
  return `module.exports = function (hookArgs) {
  return (args, originalMethod) => {
      return originalMethod(...args).then(originalPatterns => {
          return [...originalPatterns, 'node_modules/@${npmScope}/**/*', '!node_modules/@${npmScope}/**/*.ts'];
      });
  };
}
  `;
}

function getxPlatPostinstall() {
  return `//#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

// Copy potential hooks from root dependencies to app
const hooksSrc = '../../hooks';
const hooksDest = 'hooks';
console.info(\`Copying \${hooksSrc} -> \${hooksDest}\`);
fs.copySync(hooksSrc, hooksDest);

const beforeWatchSrc = 'tools/xplat-before-watch.js';
const beforeWatchDest = 'hooks/before-watchPatterns/xplat-before-watch.js';
console.info(\`Copying \${beforeWatchSrc} -> \${beforeWatchDest}\`);
fs.copySync(beforeWatchSrc, beforeWatchDest);
  `;
}

function getTsConfigESM() {
  return `{
    "extends": "./tsconfig",
    "compilerOptions": {
        "module": "es2015",
        "moduleResolution": "node"
    },
    "include": [
        "references.d.ts",
        "app/app.module.ngfactory.d.ts",
        "app/main.aot.ts",
        "app/**/*.module.ts"
    ]
}
      `
}

function getWebpackConfig() {
  return `const { join, relative, resolve, sep } = require("path");

const webpack = require("webpack");
const nsWebpack = require("nativescript-dev-webpack");
const nativescriptTarget = require("nativescript-dev-webpack/nativescript-target");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
const { NativeScriptWorkerPlugin } = require("nativescript-worker-loader/NativeScriptWorkerPlugin");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");

module.exports = env => {
    // Add your custom Activities, Services and other Android app components here.
    const appComponents = [
        "tns-core-modules/ui/frame",
        "tns-core-modules/ui/frame/activity",
    ];

    const platform = env && (env.android && "android" || env.ios && "ios");
    if (!platform) {
        throw new Error("You need to provide a target platform!");
    }

    const platforms = ["ios", "android"];
    const projectRoot = __dirname;
    nsWebpack.loadAdditionalPlugins({ projectDir: projectRoot });

    // Default destination inside platforms/<platform>/...
    const dist = resolve(projectRoot, nsWebpack.getAppPath(platform, projectRoot));
    const appResourcesPlatformDir = platform === "android" ? "Android" : "iOS";

    const {
        // The 'appPath' and 'appResourcesPath' values are fetched from
        // the nsconfig.json configuration file
        // when bundling with \`tns run android|ios --bundle\`.
        appPath = "app",
        appResourcesPath = "app/App_Resources",

        // You can provide the following flags when running 'tns run android|ios'
        aot, // --env.aot
        snapshot, // --env.snapshot
        uglify, // --env.uglify
        report, // --env.report
    } = env;

    const appFullPath = resolve(projectRoot, appPath);
    const appResourcesFullPath = resolve(projectRoot, appResourcesPath);

    const entryModule = aot ?
        nsWebpack.getAotEntryModule(appFullPath) : 
        \`\${nsWebpack.getEntryModule(appFullPath)}.ts\`;
    const entryPath = \`.\${sep}\${entryModule}\`;

    const config = {
        mode: uglify ? "production" : "development",
        context: appFullPath,
        watchOptions: {
            ignored: [
                appResourcesFullPath,
                // Don't watch hidden files
                "**/.*",
            ]
        },
        target: nativescriptTarget,
        entry: {
            bundle: entryPath,
        },
        output: {
            pathinfo: false,
            path: dist,
            libraryTarget: "commonjs2",
            filename: "[name].js",
            globalObject: "global",
        },
        resolve: {
            extensions: [".ts", ".js", ".scss", ".css"],
            // Resolve {N} system modules from tns-core-modules
            modules: [
                resolve(__dirname, "node_modules/tns-core-modules"),
                resolve(__dirname, "node_modules"),
                "node_modules/tns-core-modules",
                "node_modules",
            ],
            alias: {
                '~': appFullPath
            },
            symlinks: true
        },
        resolveLoader: {
            symlinks: false
        },
        node: {
            // Disable node shims that conflict with NativeScript
            "http": false,
            "timers": false,
            "setImmediate": false,
            "fs": "empty",
            "__dirname": false,
        },
        devtool: "none",
        optimization: {
            splitChunks: {
                cacheGroups: {
                    vendor: {
                        name: "vendor",
                        chunks: "all",
                        test: (module, chunks) => {
                            const moduleName = module.nameForCondition ? module.nameForCondition() : '';
                            return /[\\\\/]node_modules[\\\\/]/.test(moduleName) ||
                                    appComponents.some(comp => comp === moduleName);
                        },
                        enforce: true,
                    },
                }
            },
            minimize: !!uglify,
            minimizer: [
                new UglifyJsPlugin({
                    uglifyOptions: {
                        parallel: true,
                        cache: true,
                        output: {
                            comments: false,
                        },
                        compress: {
                            // The Android SBG has problems parsing the output
                            // when these options are enabled
                            'collapse_vars': platform !== "android",
                            sequences: platform !== "android",
                        }
                    }
                })
            ],
        },
        module: {
            rules: [
                {
                    test: new RegExp(entryPath),
                    use: [
                        // Require all Android app components
                        platform === "android" && {
                            loader: "nativescript-dev-webpack/android-app-components-loader",
                            options: { modules: appComponents }
                        },

                        {
                            loader: "nativescript-dev-webpack/bundle-config-loader",
                            options: {
                                registerPages: false,
                                loadCss: !snapshot, // load the application css if in debug mode
                            }
                        },
                    ].filter(loader => !!loader)
                },

                { test: /\\.html$|\\.xml$/, use: "raw-loader" },

                // tns-core-modules reads the app.css and its imports using css-loader
                {
                    test: /[\\/|\\\\]app\\.css$/,
                    use: {
                        loader: "css-loader",
                        options: { minimize: false, url: false },
                    }
                },
                {
                    test: /[\\/|\\\\]app\\.scss$/,
                    use: [
                        { loader: "css-loader", options: { minimize: false, url: false } },
                        "sass-loader"
                    ]
                },

                // Angular components reference css files and their imports using raw-loader
                { test: /\\.css$/, exclude: /[\\/|\\\\]app\\.css$/, use: "raw-loader" },
                { test: /\\.scss$/, exclude: /[\\/|\\\\]app\\.scss$/, use: ["raw-loader", "resolve-url-loader", "sass-loader"] },

                // Compile TypeScript files with ahead-of-time compiler.
                {
                    test: /.ts$/, use: [
                        "nativescript-dev-webpack/moduleid-compat-loader",
                        "@ngtools/webpack",
                    ]
                },

                // Mark files inside \`@angular/core\` as using SystemJS style dynamic imports.
                // Removing this will cause deprecation warnings to appear.
                {
                    test: /[\\/\\\\]@angular[\\/\\\\]core[\\/\\\\].+\\.js$/,
                    parser: { system: true },
                },
            ],
        },
        plugins: [
            // Define useful constants like TNS_WEBPACK
            new webpack.DefinePlugin({
                "global.TNS_WEBPACK": "true",
            }),
            // Remove all files from the out dir.
            new CleanWebpackPlugin([ \`\${dist}/**/*\` ]),
            // Copy native app resources to out dir.
            new CopyWebpackPlugin([
                {
                    from: \`\${appResourcesFullPath}/\${appResourcesPlatformDir}\`,
                    to: \`\${dist}/App_Resources/\${appResourcesPlatformDir}\`,
                    context: projectRoot
                },
            ]),
            // Copy assets to out dir. Add your own globs as needed.
            new CopyWebpackPlugin([
                { from: 'assets/**' },
                { from: "fonts/**" },
                { from: "**/*.jpg" },
                { from: "**/*.png" },
            ], { ignore: [\`\${relative(appPath, appResourcesFullPath)}/**\`] }),
            // Generate a bundle starter script and activate it in package.json
            new nsWebpack.GenerateBundleStarterPlugin([
                "./vendor",
                "./bundle",
            ]),
            // For instructions on how to set up workers with webpack
            // check out https://github.com/nativescript/worker-loader
            new NativeScriptWorkerPlugin(),
            // AngularCompilerPlugin with augmented NativeScript filesystem to handle platform specific resource resolution.
            new nsWebpack.NativeScriptAngularCompilerPlugin({
                entryModule: resolve(appPath, "app.module#AppModule"),
                tsConfigPath: join(__dirname, "tsconfig.esm.json"),
                skipCodeGeneration: !aot,
                platformOptions: {
                    platform,
                    platforms,
                },
            }),
            // Does IPC communication with the {N} CLI to notify events when running in watch mode.
            new nsWebpack.WatchStateLoggerPlugin(),
        ],
    };

    if (report) {
        // Generate report files for bundles content
        config.plugins.push(new BundleAnalyzerPlugin({
            analyzerMode: "static",
            openAnalyzer: false,
            generateStatsFile: true,
            reportFilename: resolve(projectRoot, "report", \`report.html\`),
            statsFilename: resolve(projectRoot, "report", \`stats.json\`),
        }));
    }

    if (snapshot) {
        config.plugins.push(new nsWebpack.NativeScriptSnapshotPlugin({
            chunk: "vendor",
            requireModules: [
                "reflect-metadata",
                "@angular/platform-browser",
                "@angular/core",
                "@angular/common",
                "@angular/router",
                "nativescript-angular/platform-static",
                "nativescript-angular/router",
            ],
            projectRoot,
            webpackConfig: config,
        }));
    }

    return config;
};
  `
}