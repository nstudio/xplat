const webpack = require("@nativescript/webpack");

module.exports = (env) => {
	webpack.init(env);

  // ignore warnings from env base
  webpack.chainWebpack(config => {
    config.set(
      'ignoreWarnings',
      (config.get('ignoreWarnings') || []).concat([
        /environments\/base/
      ])
    )
  });
  
	return webpack.resolveConfig();
};
