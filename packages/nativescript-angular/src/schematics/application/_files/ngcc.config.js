module.exports = {
  packages: {
    '@nativescript/angular': {
      entryPoints: {
        '.': {
          override: {
            main: './index.js',
            typings: './index.d.ts'
          },
          ignoreMissingDependencies: true
        }
      }
    },
    'nativescript-ngx-fonticon': {
      entryPoints: {
        '.': {
          override: {
            main: './nativescript-ngx-fonticon.js',
            typings: './nativescript-ngx-fonticon.d.ts'
          },
          ignoreMissingDependencies: true
        }
      }
    },
    '@nota/nativescript-accessibility-ext': {
      entryPoints: {
        '.': {
          override: {
            main: './index.js',
            typings: './index.d.ts'
          },
          ignoreMissingDependencies: true
        }
      }
    }
  }
};
