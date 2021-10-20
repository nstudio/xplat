const webpack = require('@nativescript/webpack');

module.exports = (env) => {

  webpack.init(env);
  webpack.useConfig('angular');

  return webpack.resolveConfig();
};
