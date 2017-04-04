module.exports = function(grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		copy: {
			main: {
				files: [
					{ src: ['node_modules/jquery/dist/jquery.js'], dest: 'js/lib/jquery.js' },
					{ src: ['css/modality/src/modality-interstitial.gif'], dest: 'css/modality/modality-interstitial.gif' }
				]
			}
		},

		concat: {
			js: {
				src:  ['js/modality/src/modality.js', 'js/modality/src/modality-content.js', 'js/modality/src/modality-modal.js', 'js/modality/src/modality-popover.js'],
				dest: 'js/modality/modality-min.js'
			},
			css: {
				src:  'css/modality/src/*.css',
				dest: 'css/modality/modality-min.css'
			}
		},

		uglify: {
			js: {
				src:  'js/modality/modality-min.js',
				dest: 'js/modality/modality-min.js'
			}
		},

	    cssmin: {
	        css: {
	            src:  'css/modality/modality-min.css',
	            dest: 'css/modality/modality-min.css'
	        }
	    }		

	});

	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');

	grunt.registerTask('default', ['copy', 'concat', 'uglify', 'cssmin']);

};