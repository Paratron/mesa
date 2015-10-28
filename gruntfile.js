module.exports = function (grunt) {
	'use strict';

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-contrib-copy');

	grunt.initConfig({
		uglify: {
			main: {
				files: {
					'dist/lib/frontend/_inject.src.min.js': ['src/lib/frontend/_inject.src.js'],
					'dist/lib/js/detect-zoom.min.js': 'src/lib/js/detect-zoom.js'
				}
			}
		},
		copy: {
			jsLang: {
				files: {
					'cms/lang/en.js': 'cms/lang/en.json'
				},
				options: {
					processContent: function (content, srcpath) {
						return 'var lang = ' + content;
					}
				}
			},

		},

		less: {
			main: {
				files: {
					'cms/css/main.css': 'cms/less/main.less',
					'cms/css/material.css': 'cms/less/material/_material.less'
				}
			}
		}
	});

	grunt.registerTask('default', ['less', 'uglify', 'copy']);
};