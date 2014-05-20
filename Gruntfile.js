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
    shell: {                                
        generateParser: {                   
            options: {                      
                stdout: true
            },
            command: 'node generate_parser.js'
        }
    },
    nodeunit: {
      all: ['test/**/*_test.js'],
      options: {
        reporter: 'grunt'
      }
    },
    jshint: {
      options: {
        ignores: 'src/parser/lisb.parser.js'
      },
      all: ['Gruntfile.js', 'generate_parser.js',  'src/**/*.js', 'test/**/*.js']
    },
    concat: {
      options: {
        separator: ";",
      },
      dist: {
        src: ["src/lisb.evaluator.js", "src/parser/lisb.statements.js", "src/parser/lisb.parser.js"],
        dest: "dist/lisb.js",
      }
    } 
  });

  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');

  // Default task(s).
  grunt.registerTask('default', [ 'jshint', 'shell:generateParser', 'concat', 'nodeunit:all']);

};
