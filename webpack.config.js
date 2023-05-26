const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");
const nodeExternals = require("webpack-node-externals");
const NodemonPlugin = require("nodemon-webpack-plugin");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");

module.exports = {
    mode: process.env.NODE_ENV,
    externals: nodeExternals(),
    target: "node",
    context: path.resolve(__dirname, "src"),
    entry: "./main.ts",
    output: {
        filename: "server.js",
        path: path.resolve(__dirname, "dist"),
        publicPath: "dist",
    },
    resolve: {
        plugins: [new TsconfigPathsPlugin()],
        extensions: [".ts", ".js"],
    },
    module: {
        rules: [
            {
                test: /\.ts?$/,
                loader: "ts-loader",
            },
        ],
    },
    plugins: [
        new NodemonPlugin({
            stdin: false,
            watch: [path.resolve("./dist"), ".env"],
        }),
    ],
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                minify: TerserPlugin.uglifyJsMinify,
                parallel: 4,
            }),
        ],
    },
};
