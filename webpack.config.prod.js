const path = require('path');
const common = require('./webpack.config.js');

module.exports = (env) => ({
    extends: path.resolve(__dirname, './webpack.config.js'),
    mode: 'production',
    devtool: false,
});