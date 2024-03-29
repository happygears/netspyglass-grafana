module.exports = function(grunt) {
  const IS_DEV = process.env.NODE_ENV !== 'production';
  const fs = require('fs');
  const path = require('path');
  const semver = require('semver');
  const sass = require("node-sass");
  const destPath = 'dist';
  const packageData = require(path.join(__dirname, "package.json"));
  const pluginData = require(path.join(__dirname, "plugin.json"));
  const version = packageData.version;

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
              cwd: "src",
              expand: true,
              src: ["**/*", "!**/*.js", "!**/*.scss"],
              dest: destPath,
          },
          img_to_dist: {
              cwd: "src",
              expand: true,
              src: ["img/*"],
              dest: destPath + "/src/",
          },
          pluginDef: {
              expand: true,
              src: ["plugin.json", "README.md", "img/*"],
              dest: destPath,
          },
          externals: {
              cwd: "src",
              expand: true,
              src: ["**/external/*"],
              dest: "dist",
          },
      },

      watch: {
          rebuild_all: {
              files: ["src/**/*", "plugin.json"],
              tasks: ["build"],
              options: { spawn: false, atBegin: true },
          },
      },

      babel: {
          options: {
              sourceMap: IS_DEV,
              presets: ["env"],
          },
          dist: {
              options: {
                  plugins: [
                      ["transform-define", { NSG_PLUGIN_ID: pluginData.id }],
                      "transform-es2015-modules-systemjs",
                      "transform-es2015-for-of",
                  ],
              },
              files: [
                  {
                      cwd: "src",
                      expand: true,
                      src: ["**/*.js"],
                      dest: destPath,
                      ext: ".js",
                  },
              ],
          },
          distTestNoSystemJs: {
              files: [
                  {
                      cwd: "src",
                      expand: true,
                      src: ["**/*.js"],
                      dest: destPath + "/test",
                      ext: ".js",
                  },
              ],
          },
          distTestsSpecsNoSystemJs: {
              files: [
                  {
                      expand: true,
                      cwd: "spec",
                      src: ["**/*.js"],
                      dest: destPath + "/test/spec",
                      ext: ".js",
                  },
              ],
          },
      },

      mochaTest: {
          options: {
              reporter: "spec",
          },
          test: {
              src: [
                  destPath + "/test/spec/test-main.js",
                  destPath + "/test/spec/*_spec.js",
              ],
          },
      },

      sass: {
          options: {
              implementation: sass,
              sourceMap: IS_DEV,
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
  });

  var buildTasks = ['clean', 'sass', 'copy:src_to_dist', 'copy:img_to_dist', 'copy:pluginDef', 'copy:externals', 'babel:dist'];

  if (!IS_DEV) {
    buildTasks.push('test');
  }

  grunt.registerTask('build', buildTasks);
  grunt.registerTask('test', ['babel:distTestNoSystemJs', 'babel:distTestsSpecsNoSystemJs', 'mochaTest']);
  grunt.registerTask('default', 'build');
    
  grunt.registerTask("fix-plugin-version", "", function () {
      if (packageData && pluginData) {
          pluginData.info.version = version;

          fs.writeFileSync(
              path.join(__dirname, "plugin.json"),
              JSON.stringify(pluginData, null, 2)
          );

          console.log("plugin version: ", pluginData.info.version);
      }
  });
};
