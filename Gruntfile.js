module.exports = function(grunt) {
  const IS_DEV = process.env.NODE_ENV !== 'production';
  const fs = require('fs');
  const path = require('path');
  const semver = require('semver');
  const pluginData = require(path.join(__dirname, 'plugin.json'));
  const destPath = IS_DEV ? 'dist_dev' : 'dist';
  const currentVersion = pluginData.info.version;

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-sass');
  grunt.loadNpmTasks('grunt-babel');
  grunt.loadNpmTasks('grunt-mocha-test');

  grunt.loadNpmTasks('grunt-bump');
  grunt.loadNpmTasks('grunt-prompt');


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
      },
      externals: {
        cwd: 'src',
        expand: true,
        src: ['**/external/*'],
        dest: 'dist'
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
    },

    bump: {
      options: {
        files: ['package.json', 'plugin.json'],
        updateConfigs: [],
        commit: false,
        createTag: false,
        push: false
      }
    },

    prompt: {
      bump: {
        options: {
          questions: [
            {
              config:  'bump.options.versionType',
              type:    'list',
              message: 'Bump version from ' + currentVersion + ' to:',
              choices: [
                {
                  value: 'prerelease',
                  name:  'Build:  '+ (currentVersion + '-?') + ' Unstable, betas, and release candidates.'
                },
                {
                  value: 'patch',
                  name:  'Patch:  ' + semver.inc(currentVersion, 'patch') + ' Backwards-compatible bug fixes.'
                },
                {
                  value: 'minor',
                  name:  'Minor:  ' + semver.inc(currentVersion, 'minor') + ' Add functionality in a backwards-compatible manner.'
                },
                {
                  value: 'major',
                  name:  'Major:  ' + semver.inc(currentVersion, 'major') + ' Incompatible API changes.'
                },
                {
                  value: 'custom',
                  name:  'Custom: ?.?.? Specify version...'
                }
              ]
            },
            {
              config:   'bump.options.setVersion',
              type:     'input',
              message:  'What specific version would you like: ',
              when:     function (answers) {
                return answers['bump.options.versionType'] === 'custom';
              },
              validate: function (value) {
                  var valid = semver.valid(value);
                  return !!valid || 'Must be a valid semver, such as 1.2.3-rc1. See http://semver.org/ for more details.';
              }
            },
          ]
        }
      }
    }
  });

  var buildTasks = ['clean', 'sass', 'copy:src_to_dist', 'copy:img_to_dist', 'copy:pluginDef', 'copy:externals', 'babel:dist'];

  if (!IS_DEV) {
    // buildTasks.unshift('bumpVersion');
    // buildTasks.push('test');
  }

  grunt.registerTask('build', buildTasks);
  grunt.registerTask('test', ['babel:distTestNoSystemJs', 'babel:distTestsSpecsNoSystemJs', 'mochaTest']);
  grunt.registerTask('bumpVersion', ['prompt:bump', 'bump']);
  grunt.registerTask('default', 'build');
};
