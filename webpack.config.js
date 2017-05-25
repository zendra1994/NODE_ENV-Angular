const webpack = require('webpack'),
  path = require('path'),
  autoprefixer = require('autoprefixer'),
  AotPlugin = require('@ngtools/webpack').AotPlugin,
  preloadWebpackPlugin = require('preload-webpack-plugin'),
  friendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin'),
  bundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin,
  webpackManifest = require('webpack-manifest-plugin'),
  webpackClean = require('clean-webpack-plugin'),
  webpackCopy = require('copy-webpack-plugin'),
  webpackHtml = require('html-webpack-plugin'),
  webpackExtract = require('extract-text-webpack-plugin');

const DEV = process.env.NODE_ENV === "development" ? true : false;
const PROD = process.env.NODE_ENV === "production" ? true : false;
const TESTING = process.env.NODE_ENV === "testing_unit" ? true : false;
const BUILD = !!process.env.BUILD;

console.log('Build: ', BUILD);
console.log('Environment: ', process.env.NODE_ENV);

const plugins = [
  new webpackClean('dist'),
  new webpackHtml({
    template: path.resolve(__dirname, 'app', 'index.html')
  }),

  new webpackExtract({
    filename: 'css/css.[hash:6].css',
    disable: DEV && !BUILD
  }),

  new webpackManifest({
    fileName: 'webpack-manifest.json',
    basePath: '/'
  }),
  new webpack.DefinePlugin({
    'env': JSON.stringify(process.env.NODE_ENV || '')
  }),

  new webpack.optimize.CommonsChunkPlugin({
    filename: 'js/[name].[hash:6].js',
    minChunks: function (module) {
      return module.context && module.context.indexOf('node_modules') !== -1;
    },
    name: 'vendor'
  }),
  new webpack.optimize.CommonsChunkPlugin({
    name: 'manifest'
  }),

  new preloadWebpackPlugin({
    rel: 'preload',
    as: 'script',
    include: [ 'manifest', 'vendor', 'app' ],
    fileBlacklist: [ /\.map/, /\.css/ ]
  }),

  new webpackCopy([
    { from: path.resolve(__dirname, 'app/favicon.ico' ), to: './' },
    { from: path.resolve(__dirname, 'app/assets/images/angular_logo.png' ), to: './images' },
    { from: path.resolve(__dirname, 'app/manifest.json' ), to: './' },

    { from: path.resolve(__dirname, 'app/src/sw.js' ), to: './' },
  ])

];

const module_rules = [
  {
    test: /\.html/,
    use: [
      { loader: 'raw-loader' },
      // {
      //   loader: 'html-loader',
      //   options: {
      //     interpolate: true
      //   }
      // },
    ]
  },
  { test: /\.pug/, use: 'pug-loader' },

  {
    test: /\.(sass|scss)/,
    exclude: /node_modules/,
    use: DEV && !BUILD ?
      [ 'style-loader', 'css-loader?sourceMap', {
          loader: 'postcss-loader?sourceMap' },
      'sass-loader?sourceMap&sourceComments' ]
    :
      webpackExtract.extract({
        use: ['css-loader', 'postcss-loader', 'sass-loader']
      })
  },

  {
    test: /\.(png|gif|jpe?g|svg)$/,
    exclude: /node_modules/,
    use: [
      {
        loader: 'url-loader',
        options: {
          limit: 1000,
          name: '[name][hash:6].[ext]',
          outputPath: 'images/'
        },
      },
      { loader: 'image-webpack-loader' }
    ]
  },
];

if (!PROD) {
  plugins.push(new friendlyErrorsWebpackPlugin())
  plugins.push(new webpack.NamedModulesPlugin());
  plugins.push(new webpack.HotModuleReplacementPlugin());
  plugins.push(new bundleAnalyzerPlugin({
    analyzerMode: DEV && !BUILD ? 'server' : 'disabled',
    analyzerHost: '127.0.0.1',
    analyzerPort: 3001,
    openAnalyzer: false,
    generateStatsFile: false,
    statsFilename: 'stats.json',
  }));

  module_rules.push({
    test: /\.tsx?/,
    loader: 'tslint-loader',
    options: {
      configFile: 'tslint.json',
    },
    enforce: 'pre',
    exclude: /node_modules/,
  });

  module_rules.push({
    test: /\.tsx?/,
    exclude: /node_modules/,
    use: [
      {
        loader: 'awesome-typescript-loader',
        options: {
          configFileName: TESTING ? 'tsconfig.spec.json' : 'tsconfig.app.json'
        }
      },
      {     loader: 'angular2-template-loader'
      }
    ]
  })

}

if(PROD) {
  module_rules.push(
    { test: /\.ts$/, loaders: ['@ngtools/webpack'] }
  );
  plugins.push(new webpack.optimize.UglifyJsPlugin({
    compress: {
      warnings: true
    },
    output: {
      comments: false
    },
    sourceMap: false
  }));
  plugins.push(new AotPlugin({
    tsConfigPath: './tsconfig.app.json',
    entryModule: 'app/src/app.module#AppModule'
  }));
}


module.exports = {
  entry: {
    'app': path.resolve(__dirname, 'app', 'src', 'main.ts'),
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'js/[name].[hash:6].js',
    publicPath: '/'
  },
  resolve: {
    extensions: [ '.ts', '.tsx', '.js', '.html', '.pug', '.css', '.sass', '.scss', '.ico', '.json' ],
    modules: [ 'node_modules' ],
    alias: {
      '~': path.resolve(__dirname, 'app'),
      '@': path.resolve(__dirname, 'app', 'src'),
    }
  },
  devServer: {
    historyApiFallback: true,
    hot: true,
    inline: true,
    port: 3000,
    contentBase: path.resolve(__dirname + '/dist')
  },
  devtool: 'source-map',
  plugins: plugins,
  module: {
    rules: module_rules
  }
}
