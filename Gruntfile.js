module.exports = function(grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		copy: {
			main: {
				files: [
					{ src: ['src/modality-interstitial.gif'], dest: 'lib/modality-interstitial.gif' }
				]
			}
		},

		concat: {
			js: {
				src:  ['src/modality.js', 'src/modality-content.js', 'src/modality-modal.js', 'src/modality-popover.js'],
				dest: 'lib/modality-min.js'
			},
			css: {
				src:  'src/*.css',
				dest: 'lib/modality-min.css'
			}
		},

		uglify: {
			js: {
				src:  'lib/modality-min.js',
				dest: 'lib/modality-min.js'
			}
		},

	    cssmin: {
	        css: {
	            src:  'lib/modality-min.css',
	            dest: 'lib/modality-min.css'
	        }
	    }		

	});

	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');

	grunt.registerTask('default', ['copy', 'concat', 'uglify', 'cssmin']);

};