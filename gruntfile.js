module.exports = function(grunt) {

grunt.initConfig({
  jasmine_nodejs: {
    options: {
        specNameSuffix: "spec.js", // also accepts an array
        helperNameSuffix: "helper.js",
        useHelpers: false,
        random: false,
        seed: null,
        defaultTimeout: null, // defaults to 5000
        stopOnFailure: false,
        traceFatal: true,
        // configure one or more built-in reporters
        reporters: {
            console: {
                colors: true,
                cleanStack: 1,       // (0|false)|(1|true)|2|3
                verbosity: 4,        // (0|false)|1|2|3|(4|true)
                listStyle: "indent", // "flat"|"indent"
                activity: false
            },
            // junit: {
            //     savePath: "./reports",
            //     filePrefix: "junit-report",
            //     consolidate: true,
            //     useDotNotation: true
            // },
            // nunit: {
            //     savePath: "./reports",
            //     filename: "nunit-report.xml",
            //     reportName: "Test Results"
            // },
            // terminal: {
            //     color: false,
            //     showStack: false,
            //     verbosity: 2
            // },
            // teamcity: true,
            // tap: true
        },
        // add custom Jasmine reporter(s)
        customReporters: []
    },
    server: {
        // target specific options
        options: {
            useHelpers: true
        },
        // spec files
        specs: [
            "spec/**"
        ],
        helpers: [
        //    "test/helpers/**"
        ]
    }
  }
});

grunt.loadNpmTasks('grunt-jasmine-nodejs');

grunt.registerTask('default', 'jasmine_node');

};
