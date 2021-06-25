const webpack = require('@nativescript/webpack');

module.exports = (env) => {
  webpack.init(env);
  webpack.useConfig('typescript');

  return webpack.resolveConfig();
};
