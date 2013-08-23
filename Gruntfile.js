'use strict';
var path = require('path');

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to match all subfolders:
// 'test/spec/**/*.js'

module.exports = function (grunt) {
    // load all grunt tasks
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    // configurable paths
    var yeomanConfig = {
      src: 'src',
      build: '.',
      test: 'test'
    };

    grunt.initConfig({
        yeoman: yeomanConfig,
        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            all: [
                '<%= yeoman.src %>/js/{,*/}*.js'
            ]
        },
        clean: {
          build: ['<%= yeoman.build %>/basespy.min.js']
        },
        uglify: {
          options: {
            preserveComments: 'some'
          },
          build: {
            files: {
              '<%= yeoman.build %>/basespy.min.js': ['<%= yeoman.src %>/basespy.js']
            }
          }
        },
        mochaTest: {
          test: {
            options: {
              ui: 'exports',
              reporter: 'spec'
            },
            src: ['test/*.test.coffee']
          }
        }
    });

    grunt.registerTask('build', [
      'clean:build',
      'jshint',
      'uglify:build',
      'test'
    ]);

    grunt.registerTask('test', [
      'mochaTest'
    ]);

    grunt.registerTask('default', [
      'build'
    ]);
};
