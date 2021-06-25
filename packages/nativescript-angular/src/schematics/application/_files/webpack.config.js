const webpack = require('@nativescript/webpack');
const { resolve } = require('path');

module.exports = (env) => {

  webpack.init(env);
  webpack.useConfig('angular');

  webpack.chainWebpack((config) => {
    // shared scss
    config.resolve.alias.set('@<%= npmScope %>/xplat-scss', resolve(__dirname, '<%= pathOffset %>libs/xplat/scss/src/'));
    config.resolve.alias.set('@<%= npmScope %>/xplat-nativescript-scss', resolve(__dirname, '<%= pathOffset %>libs/xplat/nativescript/scss/src/'));

    // ignore base env tsconfig warning
    config.set(
      'ignoreWarnings',
      (config.get('ignoreWarnings') || []).concat([
        /environments\/base/
      ])
    );
  });

  return webpack.resolveConfig();
};
