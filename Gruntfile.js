module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    // uglify: {
    //   options: {
    //     banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
    //   },
    //   build: {
    //     src: 'src/<%= pkg.name %>.js',
    //     dest: 'build/<%= pkg.name %>.min.js'
    //   }
    // }
    shell: {                                // Task
        generateParser: {                      // Target
            options: {                      // Options
                stdout: true
            },
            command: 'jison src/parser/lisb.jison -o src/parser/lisb.parser.js'
        }
    },
    nodeunit: {
      all: ['test/**/*_test.js'],
      options: {
        reporter: 'grunt'
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');

  // Default task(s).
  grunt.registerTask('default', ['shell:generateParser', 'nodeunit:all']);

};