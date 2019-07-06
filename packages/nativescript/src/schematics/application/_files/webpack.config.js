const { join, relative, resolve, sep, dirname } = require('path');

const webpack = require('webpack');
const nsWebpack = require('nativescript-dev-webpack');
const nativescriptTarget = require('nativescript-dev-webpack/nativescript-target');
const {
  nsReplaceBootstrap
} = require('nativescript-dev-webpack/transformers/ns-replace-bootstrap');
const {
  nsReplaceLazyLoader
} = require('nativescript-dev-webpack/transformers/ns-replace-lazy-loader');
const {
  nsSupportHmrNg
} = require('nativescript-dev-webpack/transformers/ns-support-hmr-ng');
const {
  getMainModulePath
} = require('nativescript-dev-webpack/utils/ast-utils');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const {
  NativeScriptWorkerPlugin
} = require('nativescript-worker-loader/NativeScriptWorkerPlugin');
const TerserPlugin = require('terser-webpack-plugin');
const { AngularCompilerPlugin } = require('@ngtools/webpack');

module.exports = env => {
  // Add your custom Activities, Services and other Android app components here.
  const appComponents = [
    'tns-core-modules/ui/frame',
    'tns-core-modules/ui/frame/activity'
  ];

  const platform = env && ((env.android && 'android') || (env.ios && 'ios'));
  if (!platform) {
    throw new Error('You need to provide a target platform!');
  }

  const projectRoot = __dirname;

  // Default destination inside platforms/<platform>/...
  const dist = resolve(
    projectRoot,
    nsWebpack.getAppPath(platform, projectRoot)
  );
  const appResourcesPlatformDir = platform === 'android' ? 'Android' : 'iOS';

  const {
    // The 'appPath' and 'appResourcesPath' values are fetched from
    // the nsconfig.json configuration file
    // when bundling with `tns run android|ios --bundle`.
    appPath = 'app',
    appResourcesPath = 'app/App_Resources',

    // You can provide the following flags when running 'tns run android|ios'
    aot, // --env.aot
    snapshot, // --env.snapshot
    uglify, // --env.uglify
    report, // --env.report
    sourceMap, // --env.sourceMap
    hmr // --env.hmr,
  } = env;

  const externals = nsWebpack.getConvertedExternals(env.externals);
  const appFullPath = resolve(projectRoot, appPath);
  const appResourcesFullPath = resolve(projectRoot, appResourcesPath);
  const tsConfigName = 'tsconfig.tns.json';
  const entryModule = `${nsWebpack.getEntryModule(appFullPath)}.ts`;
  const entryPath = `.${sep}${entryModule}`;
  const entries = { bundle: entryPath };
  if (platform === 'ios') {
    entries['tns_modules/tns-core-modules/inspector_modules'] =
      'inspector_modules.js';
  }

  const ngCompilerTransformers = [];
  const additionalLazyModuleResources = [];
  if (aot) {
    ngCompilerTransformers.push(nsReplaceBootstrap);
  }

  if (hmr) {
    ngCompilerTransformers.push(nsSupportHmrNg);
  }

  // when "@angular/core" is external, it's not included in the bundles. In this way, it will be used
  // directly from node_modules and the Angular modules loader won't be able to resolve the lazy routes
  // fixes https://github.com/NativeScript/nativescript-cli/issues/4024
  if (env.externals && env.externals.indexOf('@angular/core') > -1) {
    const appModuleRelativePath = getMainModulePath(
      resolve(appFullPath, entryModule),
      tsConfigName
    );
    if (appModuleRelativePath) {
      const appModuleFolderPath = dirname(
        resolve(appFullPath, appModuleRelativePath)
      );
      // include the lazy loader inside app module
      ngCompilerTransformers.push(nsReplaceLazyLoader);
      // include the new lazy loader path in the allowed ones
      additionalLazyModuleResources.push(appModuleFolderPath);
    }
  }

  const ngCompilerPlugin = new AngularCompilerPlugin({
    hostReplacementPaths: nsWebpack.getResolver([platform, 'tns']),
    platformTransformers: ngCompilerTransformers.map(t =>
      t(() => ngCompilerPlugin, resolve(appFullPath, entryModule))
    ),
    mainPath: resolve(appPath, entryModule),
    tsConfigPath: join(__dirname, tsConfigName),
    skipCodeGeneration: !aot,
    sourceMap: !!sourceMap,
    additionalLazyModuleResources: additionalLazyModuleResources
  });

  const config = {
    mode: uglify ? 'production' : 'development',
    context: appFullPath,
    externals,
    watchOptions: {
      ignored: [
        appResourcesFullPath,
        // Don't watch hidden files
        '**/.*'
      ]
    },
    target: nativescriptTarget,
    entry: entries,
    output: {
      pathinfo: false,
      path: dist,
      libraryTarget: 'commonjs2',
      filename: '[name].js',
      globalObject: 'global'
    },
    resolve: {
      extensions: ['.ts', '.js', '.scss', '.css'],
      // Resolve {N} system modules from tns-core-modules
      modules: [
        resolve(__dirname, 'node_modules/tns-core-modules'),
        resolve(__dirname, 'node_modules'),
        'node_modules/tns-core-modules',
        'node_modules'
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
      http: false,
      timers: false,
      setImmediate: false,
      fs: 'empty',
      __dirname: false
    },
    devtool: sourceMap ? 'inline-source-map' : 'none',
    optimization: {
      runtimeChunk: 'single',
      splitChunks: {
        cacheGroups: {
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: (module, chunks) => {
              const moduleName = module.nameForCondition
                ? module.nameForCondition()
                : '';
              return (
                /[\\/]node_modules[\\/]/.test(moduleName) ||
                appComponents.some(comp => comp === moduleName)
              );
            },
            enforce: true
          }
        }
      },
      minimize: !!uglify,
      minimizer: [
        new TerserPlugin({
          parallel: true,
          cache: true,
          terserOptions: {
            output: {
              comments: false
            },
            compress: {
              // The Android SBG has problems parsing the output
              // when these options are enabled
              collapse_vars: platform !== 'android',
              sequences: platform !== 'android',
              // custom
              drop_console: true,
              drop_debugger: true,
              ecma: 6,
              keep_infinity: platform === 'android', // for Chrome/V8
              reduce_funcs: platform !== 'android', // for Chrome/V8
              pure_funcs: [
                'this._log.debug',
                'this._log.error',
                'this._log.info',
                'this._log.warn'
              ],
              global_defs: {
                __UGLIFIED__: true
              }
            },
            // custom
            ecma: 6,
            safari10: platform !== 'android'
          }
        })
      ]
    },
    module: {
      rules: [
        {
          test: new RegExp(entryPath),
          use: [
            // Require all Android app components
            platform === 'android' && {
              loader: 'nativescript-dev-webpack/android-app-components-loader',
              options: { modules: appComponents }
            },

            {
              loader: 'nativescript-dev-webpack/bundle-config-loader',
              options: {
                angular: true,
                loadCss: !snapshot // load the application css if in debug mode
              }
            }
          ].filter(loader => !!loader)
        },

        { test: /\.html$|\.xml$/, use: 'raw-loader' },

        // tns-core-modules reads the app.css and its imports using css-loader
        {
          test: /[\/|\\]app\.css$/,
          use: [
            'nativescript-dev-webpack/style-hot-loader',
            { loader: 'css-loader', options: { minimize: false, url: false } }
          ]
        },
        {
          test: /[\/|\\]app\.scss$/,
          use: [
            'nativescript-dev-webpack/style-hot-loader',
            { loader: 'css-loader', options: { minimize: false, url: false } },
            'sass-loader'
          ]
        },

        // Angular components reference css files and their imports using raw-loader
        { test: /\.css$/, exclude: /[\/|\\]app\.css$/, use: 'raw-loader' },
        {
          test: /\.scss$/,
          exclude: /[\/|\\]app\.scss$/,
          use: ['raw-loader', 'resolve-url-loader', 'sass-loader']
        },

        // Compile TypeScript files with ahead-of-time compiler
        {
          test: /(?:\.ngfactory\.js|\.ngstyle\.js|\.ts)$/,
          exclude: /\.worker\.ts$/,
          use: [
            'nativescript-dev-webpack/moduleid-compat-loader',
            'nativescript-dev-webpack/lazy-ngmodule-hot-loader',
            '@ngtools/webpack'
          ]
        },

        // Compile Worker files with ts-loader
        { test: /\.worker\.ts$/, loader: 'ts-loader' },

        // Mark files inside `@angular/core` as using SystemJS style dynamic imports.
        // Removing this will cause deprecation warnings to appear.
        {
          test: /[\/\\]@angular[\/\\]core[\/\\].+\.js$/,
          parser: { system: true }
        }
      ]
    },
    plugins: [
      // Define useful constants like TNS_WEBPACK
      new webpack.DefinePlugin({
        'global.TNS_WEBPACK': 'true',
        process: undefined
      }),
      // Remove all files from the out dir.
      new CleanWebpackPlugin([`${dist}/**/*`]),
      // Copy native app resources to out dir.
      new CopyWebpackPlugin([
        {
          from: `${appResourcesFullPath}/${appResourcesPlatformDir}`,
          to: `${dist}/App_Resources/${appResourcesPlatformDir}`,
          context: projectRoot
        }
      ]),
      // Copy assets to out dir. Add your own globs as needed.
      new CopyWebpackPlugin(
        [{ from: { glob: 'assets/**' } }, { from: { glob: 'fonts/**' } }],
        {
          ignore: [`${relative(appPath, appResourcesFullPath)}/**`]
        }
      ),
      // Generate a bundle starter script and activate it in package.json
      new nsWebpack.GenerateBundleStarterPlugin(
        // Don't include `runtime.js` when creating a snapshot. The plugin
        // configures the WebPack runtime to be generated inside the snapshot
        // module and no `runtime.js` module exist.
        (snapshot ? [] : ['./runtime']).concat(['./vendor', './bundle'])
      ),
      // For instructions on how to set up workers with webpack
      // check out https://github.com/nativescript/worker-loader
      new NativeScriptWorkerPlugin(),
      ngCompilerPlugin,
      // Does IPC communication with the {N} CLI to notify events when running in watch mode.
      new nsWebpack.WatchStateLoggerPlugin()
    ]
  };

  if (report) {
    // Generate report files for bundles content
    config.plugins.push(
      new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        openAnalyzer: false,
        generateStatsFile: true,
        reportFilename: resolve(projectRoot, 'report', `report.html`),
        statsFilename: resolve(projectRoot, 'report', `stats.json`)
      })
    );
  }

  if (snapshot) {
    config.plugins.push(
      new nsWebpack.NativeScriptSnapshotPlugin({
        chunk: 'vendor',
        angular: true,
        requireModules: [
          'reflect-metadata',
          '@angular/platform-browser',
          '@angular/core',
          '@angular/common',
          '@angular/router',
          'nativescript-angular/platform-static',
          'nativescript-angular/router'
        ],
        projectRoot,
        webpackConfig: config
      })
    );
  }

  if (hmr) {
    config.plugins.push(new webpack.HotModuleReplacementPlugin());
  }

  return config;
};
