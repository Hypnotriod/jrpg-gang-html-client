const path = require('path');
const common = require('./webpack.config.js');

module.exports = (env) => ({
    extends: path.resolve(__dirname, './webpack.config.js'),
    devtool: 'inline-source-map',
    mode: 'development',
    devServer: {
        static: {
            directory: path.resolve(__dirname, 'dist'),
        },
        compress: true,
        port: 9000,
        devMiddleware: {
            writeToDisk: true,
            mimeTypes: { css: 'text/css' },
        }
    }
});