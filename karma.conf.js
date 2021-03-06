// Karma configuration file, see link for more information
// https://karma-runner.github.io/0.13/config/configuration-file.html

const webpackConfig = require('./webpack.dev');

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    // plugins: [
    //   require('karma-jasmine'),
    //   require('karma-chrome-launcher'),
    //   require('karma-jasmine-html-reporter'),
    //   require('karma-coverage-istanbul-reporter'),
    // ],
    client:{
      clearContext: false // leave Jasmine Spec Runner output visible in browser
    },
    files: [
      { pattern: './karma.entry.ts', watched: false }
    ],
    preprocessors: {
      './karma.entry.ts': ['webpack']
    },
    mime: {
      'text/x-typescript': ['ts','tsx']
    },
    coverageIstanbulReporter: {
      reports: [ 'html', 'lcovonly' ],
      fixWebpackSourcePaths: true
    },
    webpack: {
      module: webpackConfig.module,
      resolve: webpackConfig.resolve
    },
    reporters: ['progress', 'kjhtml'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chrome'],
    singleRun: false
  });
};
