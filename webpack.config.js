const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = (env) => ({
    entry: './src/index.ts',
    devtool: 'inline-source-map',
    mode: 'development',
    module: {
        rules: [
            {
                test: /app-config\.json$/,
                loader: 'string-replace-loader',
                options: {
                    search: '${GAME_SERVER_WS_URL}',
                    replace: env.gameServerWsUrl,
                }
            },
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    plugins: [
        new CleanWebpackPlugin(),
        new CopyPlugin({
            patterns: [
                { from: 'public' },
            ],
        }),
        new HtmlWebpackPlugin({
            template: 'template/index.html',
            scriptLoading: 'defer'
        })
    ],
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: 'main.min-[fullhash].js',
        path: path.resolve(__dirname, 'dist'),
    },
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
