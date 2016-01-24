module.exports = function(grunt) {

grunt.initConfig({
  jasmine_node: {
    options: {
      forceExit: true,
      match: '.',
      matchall: false,
      extensions: 'js',
      specNameMatcher: 'spec'
    },
    all: []
  }
});

grunt.loadNpmTasks('grunt-jasmine-node');

grunt.registerTask('default', 'jasmine_node');

};
