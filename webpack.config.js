const path = require('path');
const webpack = require('webpack');
require('dotenv').config();
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: './src/js/index.js', //location of your main js file
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'js/bundle.js' // where js files would be bundled to
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: 'index.html', // name of html file to be created
            template: './src/index.html' // source from which html file would be created
        }),
        new webpack.DefinePlugin({
            __MAPBOX_TOKEN__: JSON.stringify(process.env.MAPBOX_TOKEN),
            __SERVER_ENDPOINT__: JSON.stringify(process.env.SERVER_ENDPOINT)
        }),
        new CopyPlugin({
            patterns: [{
                    from: './src/css',
                    to: 'css'
                },
                {
                    from: './src/assets',
                    to: 'assets'
                }
            ]
        })
    ]
}
