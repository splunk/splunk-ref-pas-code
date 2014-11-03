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

  var appSource = path.join(__dirname, splunkConfig.splunkApp);

  // -------------------------------------
  // splunk-pack task configuration
  // -------------------------------------

  // Specify config for splunk-pack task
  splunkConfig.pack = {
    sourceDir: appSource,
    output: path.join(__dirname, 'deploy', (splunkConfig.splunkApp + '.tar.gz')),
    source: [
      '**/*'
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
      tasks: ['build']
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
      files: 
      [
        'Gruntfile.js',
        path.join(appSource, 'appserver/static/*.js')
      ],
      options: {
        ignores: 
        [
          path.join(appSource, 'appserver/static/lib/components/*.js'),
        ],
        globals: {
          console: true,
          module: true,
          require: true,
          process: true,
          Buffer: true,
          __dirname: true
        },
        "-W030": true
      }
    },
    jsdoc : {
        dist : {
            src: 
            [ 
              path.join(appSource, 'appserver/static/lib/*.js'),
              path.join(appSource, 'appserver/static/tests/*.js'),
              'README.md'
            ], 
            options: {
                destination: '.build/jsdoc',
                configure: 'jsdoc.conf.json',
                template: 'node_modules/grunt-jsdoc/node_modules/jsdoc/templates/default'
            }
        }
    },
    copy: {
      jsdoc: {
        expand: true, 
        flatten: true, 
        cwd: '.build/jsdoc', 
        src: '*.html', 
        dest: path.join(appSource, 'default/data/ui/views/'), 
        filter: 'isFile',
        rename: function(dest, src) {
          return dest + 'jsdoc_' + src.slice(0, -'.html'.length).replace('.', '_') + '.xml';
        },
        options: {
          process: function (content, srcpath, destpath) {
            return content.replace(
                /(href=['"])(?!http)([^'"]*)(?:.html)((?:#(?:[^'"])*)?['"])/g, 
                function(match, p1, p2, p3, offset, string) {
                  return p1 + 'jsdoc_' + p2.replace('.', '_') + p3;
                }
              );
          }
        }
      },
      bower_components: {
        files: [
          { expand: true, dest: path.join(appSource, 'appserver/static/components'), cwd: 'bower_components/mocha', src: [ 'mocha.js', 'mocha.css' ] },
          { expand: true, dest: path.join(appSource, 'appserver/static/components'), cwd: 'bower_components/chai', src: 'chai.js' }
        ]
      }
    },
    watch: watchConfig,
    clean: {
      components: path.join(appSource, 'appserver/static/components'),
      jsdoc: path.join(appSource, 'default/data/ui/views/jsdoc_*.xml'),
      build: '.build',
      deploy: ['deploy', path.join(appSource, 'local'), path.join(appSource, 'metadata')]
    }
  });

  // Load splunkdev-grunt
  grunt.loadNpmTasks('splunkdev-grunt');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-jsdoc');

  grunt.registerTask('mkdir-deploy', function() {
    return grunt.file.mkdir('deploy');
  });


  grunt.registerTask('build', 
    [
      'clean:components',
      'clean:jsdoc',
      'clean:build',
      'jshint',
      'jsdoc',
      'copy'
    ]);
  grunt.registerTask('pack', 
    [
      'build',
      'clean:deploy', 
      'mkdir-deploy', 
      'splunk-pack'
    ]);
  grunt.registerTask('default', ['build']);
};
