module.exports = function(grunt) {
  const IS_DEV = process.env.NODE_ENV !== 'production';
  const fs = require('fs');
  const path = require('path');
  const pluginData = require(path.join(__dirname, 'plugin.json'));
  const destPath = IS_DEV ? 'dist_dev' : 'dist';

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-sass');
  grunt.loadNpmTasks('grunt-babel');
  grunt.loadNpmTasks('grunt-mocha-test');


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
        tasks: ['build'],
        options: {spawn: false, atBegin: true}
      }
    },

    babel: {
      options: {
        sourceMap: IS_DEV,
        presets:  ['env']
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
      options: {
        reporter: 'spec'
      },
      test: {
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

  grunt.registerTask('build', ['clean', 'sass', 'copy:src_to_dist', 'copy:img_to_dist', 'copy:pluginDef', 'babel:dist']);

  grunt.registerTask('test', ['babel:distTestNoSystemJs', 'babel:distTestsSpecsNoSystemJs', 'mochaTest']);

  grunt.registerTask('default', IS_DEV ? ['build'] : ['build', 'test']);
};
