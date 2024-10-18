const webpack = require('webpack');

module.exports = {
  output: 'export',
  basePath: '',      // Ensures that all assets are loaded from the root path
  assetPrefix: './',
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Polyfill 'global' variable in the browser (renderer) environment
      config.plugins.push(
        new webpack.ProvidePlugin({
          global: 'global',  // Define global variable for browser-side
        })
      );
    }

    return config;
  },
  reactStrictMode: true,  // Optional: Enables React strict mode
};