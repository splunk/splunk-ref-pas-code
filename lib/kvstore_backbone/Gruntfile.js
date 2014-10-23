/*jshint globalstrict: true*/ 'use strict';

var configuration = require('splunkdev-grunt/lib/configuration'),
    splunkEnvironment = require('splunkdev-grunt/lib/environment'),
    splunkWatchConfig = require('splunkdev-grunt/lib/watchConfig'),
    path = require('path');

var pkg = require('./package.json');

module.exports = function(grunt) {
  // Verify environment
  if (!splunkEnvironment.splunkHome()) {
    grunt.fail.fatal('Could not locate splunk home directory');
  }

  // Verify configuration
  var splunkConfig = configuration.get();
  if (!splunkConfig) {
    grunt.fail.fatal(
      'Could not load configuration for current Splunk instance. Use `splunkdev configure`.' +
      'If `splunkdev` is not available install it with `npm install -g splunkdev`.');
  }

  // Set splunk application
  splunkConfig.splunkApp = 'kvstore_backbone';

  // -------------------------------------
  // splunk-pack task configuration
  // -------------------------------------

  // Specify config for splunk-pack task
  splunkConfig.pack = {
    sourceDir: __dirname,
    output: path.join(__dirname, (splunkConfig.splunkApp + '.tar.gz')),
    source: [
      './**/*',
      '!./local/**',
      '!./*.tar.gz',
      '!./node_modules/**',
      '!./package.json'
    ]
  };

  // all node_modules are excluded by default, let's include only 
  // modules which are required for production (not a dev dependencies)
  // Note: for bundle/peer/option dependencies you need to manually update this script.
  if (pkg.dependencies) {
    Object.keys(pkg.dependencies).forEach(function(module) {
      splunkConfig.pack.source.push('./node_modules/' + module + '/**');
    });
  }

  // -------------------------------------
  // splunk-watch task configuration
  // -------------------------------------

  // Watch config. Launch jshint for all changed JS files
  var watchConfig = {
    js: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint']
    }
  };

  // Add watch configuration for splunk app (reload splunk)
  watchConfig = splunkWatchConfig.watchForApp(watchConfig, splunkConfig.splunkApp);

  // -------------------------------------
  // splunk-services task configuration
  // -------------------------------------

  // Initialize Splunk config
  grunt.config.init({
    splunk: splunkConfig,
    jshint: {
      files: ['Gruntfile.js', 'django/kvstore_backbone/static/kvstore_backbone/**/*.js'],
      options: {
        ignores: ['django/kvstore_backbone/static/kvstore_backbone/bower_components/**/*'],
        globals: {
          console: true,
          module: true,
          require: true,
          process: true,
          Buffer: true,
          __dirname: true
        }
      }
    },
    watch: watchConfig
  });

  // Load splunkdev-grunt
  grunt.loadNpmTasks('splunkdev-grunt');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.registerTask('default', ['watch']);
  grunt.registerTask('build', ['splunk-pack']);
};
