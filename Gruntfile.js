module.exports = function(grunt) {

  var IS_DEV = process.env.NODE_ENV !== 'production';

  require('load-grunt-tasks')(grunt);

  const fs = require('fs');
  const path = require('path');
  const pluginData = require(path.join(__dirname, 'plugin.json'));
  const destPath = IS_DEV ? 'dist_dev' : 'dist';

  grunt.loadNpmTasks('grunt-execute');
  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.initConfig({

    clean: [destPath],

    copy: {
      src_to_dist: {
        cwd: 'src',
        expand: true,
        src: ['**/*', '!**/*.js', '!**/*.scss'],
        dest: destPath
      },
      img_to_dist: {
        cwd: 'src',
        expand: true,
        src: ['img/*'],
        dest: destPath + '/src/'
      },
      pluginDef: {
        expand: true,
        src: [ 'plugin.json', 'README.md', 'img/*' ],
        dest: destPath
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
          dest: destPath,
          ext:'.js'
        }]
      },
      distTestNoSystemJs: {
        files: [{
          cwd: 'src',
          expand: true,
          src: ['**/*.js'],
          dest: destPath + '/test',
          ext:'.js'
        }]
      },
      distTestsSpecsNoSystemJs: {
        files: [{
          expand: true,
          cwd: 'spec',
          src: ['**/*.js'],
          dest: destPath + '/test/spec',
          ext:'.js'
        }]
      }
    },

    mochaTest: {
      test: {
        options: {
          reporter: 'spec'
        },
        src: [destPath + '/test/spec/test-main.js', destPath + '/test/spec/*_spec.js']
      }
    },

    sass: {
      options: {
        sourceMap: IS_DEV
      },
      dist: {
        files: [{
          expand: true,
          cwd: 'src/styles/',
          src: ['theme.*.scss'],
          dest: destPath + '/styles/',
          ext: '.css',
          extDot: 'last'
        }]
      }
    }
  });

  //TODO: fix tests
  grunt.registerTask('default', ['clean', 'sass', 'copy:src_to_dist', 'copy:img_to_dist', 'copy:pluginDef', 'babel']);//, 'mochaTest'
};
