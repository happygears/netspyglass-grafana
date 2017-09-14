module.exports = function(grunt) {

  var IS_DEV = process.env.NODE_ENV !== 'production';

  require('load-grunt-tasks')(grunt);

  const fs = require('fs');
  const path = require('path');
  const pluginData = require(path.join(__dirname, 'plugin.json'));

  grunt.loadNpmTasks('grunt-execute');
  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.initConfig({

    clean: ["dist"],

    copy: {
      src_to_dist: {
        cwd: 'src',
        expand: true,
        src: ['**/*', '!**/*.js', '!**/*.scss'],
        dest: 'dist'
      },
      img_to_dist: {
        cwd: 'src',
        expand: true,
        src: ['img/*'],
        dest: 'dist/src/'
      },
      pluginDef: {
        expand: true,
        src: [ 'plugin.json', 'README.md', 'img/*' ],
        dest: 'dist'
      }
    },

    watch: {
      rebuild_all: {
        files: ['src/**/*', 'plugin.json'],
        tasks: ['default'],
        options: {spawn: false, atBegin: true}
      }
    },

    babel: {
      options: {
        sourceMap: IS_DEV,
        presets:  ['es2015']
      },
      dist: {
        options: {
          plugins: [
            ['transform-define', {'NSG_PLUGIN_ID': pluginData.id}],
            'transform-es2015-modules-systemjs',
            'transform-es2015-for-of',
          ]
        },
        files: [{
          cwd: 'src',
          expand: true,
          src: ['**/*.js'],
          dest: 'dist',
          ext:'.js'
        }]
      },
      distTestNoSystemJs: {
        files: [{
          cwd: 'src',
          expand: true,
          src: ['**/*.js'],
          dest: 'dist/test',
          ext:'.js'
        }]
      },
      distTestsSpecsNoSystemJs: {
        files: [{
          expand: true,
          cwd: 'spec',
          src: ['**/*.js'],
          dest: 'dist/test/spec',
          ext:'.js'
        }]
      }
    },

    mochaTest: {
      test: {
        options: {
          reporter: 'spec'
        },
        src: ['dist/test/spec/test-main.js', 'dist/test/spec/*_spec.js']
      }
    },

    sass: {
      options: {
        sourceMap: IS_DEV
      },
      dist: {
        files: {
          'dist/styles/theme.dark.css': 'src/styles/theme.dark.scss',
          'dist/styles/theme.light.css': 'src/styles/theme.light.scss'
        }
      }
    }
  });

  //TODO: fix tests
  grunt.registerTask('default', ['clean', 'sass', 'copy:src_to_dist', 'copy:img_to_dist', 'copy:pluginDef', 'babel']);//, 'mochaTest'
};
