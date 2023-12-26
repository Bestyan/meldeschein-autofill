
import webpack from "webpack";
import path from "path";
import { CleanWebpackPlugin } from "clean-webpack-plugin";
import CopyWebpackPlugin from "copy-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import WriteFilePlugin from "write-file-webpack-plugin";

const fileExtensions = ["jpg", "jpeg", "png", "gif", "eot", "otf", "svg", "ttf", "woff", "woff2"];

const config: webpack.Configuration = {
  mode: process.env.NODE_ENV as "development" | "production" | undefined || "development",
  devtool: 'inline-source-map',
  entry: {
    popup: path.join(__dirname, "src", "js", "main", "popup.js"),
    options: path.join(__dirname, "src", "js", "main", "options.js"),
    background: path.join(__dirname, "src", "js", "main", "background.ts")
  },
  output: {
    path: path.join(__dirname, "build"),
    filename: "[name].bundle.js"
  },
  module: {
    rules: [{
      test: /\.css$/,
      use: ['style-loader', 'css-loader'],
      exclude: /node_modules/
    },
    {
      test: /\tabulator-tables.min.css$/,
      use: ['style-loader', 'css-loader']
    },
    {
      test: /\.tsx?$/,
      use: 'ts-loader',
      exclude: /node_modules/,
    },
    {
      test: new RegExp('.(' + fileExtensions.join('|') + ')$'),
      use: ['file-loader?name=[name].[ext]'],
      exclude: /node_modules/
    },
    {
      test: /\.html$/,
      use: ['html-loader'],
      exclude: /node_modules/
    }
    ]
  },
  resolve: {
    alias: {
      // use bare min to avoid eval() calls which are no longer permitted with manifest v3
      // requires import of regenerator-runtime/runtime whenever exceljs is used
      'exceljs': 'exceljs/dist/exceljs.bare.min.js'
    },
    extensions: ['.tsx', '.ts', '.js']
  },
  plugins: [
    // clean the build folder
    new CleanWebpackPlugin(),
    // expose and write the allowed env vars on the compiled bundle
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'development', // use 'development' unless process.env.NODE_ENV is defined
      DEBUG: false
    }),
    new CopyWebpackPlugin({
      patterns: [{
        from: "src/manifest.json",
        transform(content, path) {
          // generates the manifest file using the package.json informations
          return Buffer.from(JSON.stringify({
            description: process.env.npm_package_description,
            version: process.env.npm_package_version,
            ...JSON.parse(content.toString())
          }));
        }
      }]
    }),
    new CopyWebpackPlugin({
      patterns: [{
        from: 'src/js/main/content_scripts/scripts',
        to: 'content_scripts'
      }]
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "src", "popup.html"),
      filename: "popup.html",
      chunks: ["popup"] // list of js bundle files to be included
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "src", "options.html"),
      filename: "options.html",
      chunks: ["options"] // list of js bundle files to be included
    }),
    new WriteFilePlugin() as { apply(...args: any[]): void; }   // THE TYPE ASSERTION GETS RID OF THE ERROR
  ]
};

export default config;