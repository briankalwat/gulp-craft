//load plugins
var gulp             = require('gulp'),
	autoprefixer     = require('gulp-autoprefixer'),
	concat           = require('gulp-concat'),
	livereload       = require('gulp-livereload'),
	minifycss        = require('gulp-minify-css'),
	newer            = require('gulp-newer'),
	notify           = require('gulp-notify'),
	plumber          = require('gulp-plumber'),
	rename           = require('gulp-rename'),
	sass             = require('gulp-sass'),
	size             = require('gulp-size'),
	uglify           = require('gulp-uglify'),
	watch            = require('gulp-watch'),
	path             = require('path'),
	lazypipe         = require('lazypipe');

//the title and icon that will be used for the Grunt notifications
var notifyInfo = {
	title: 'Your Project Name',
	icon: path.join(__dirname, 'gulp.png')
};

//glob patterns that are used more than once
var scssGlob = 'src/scss/**/*.scss',
	jsIndividualGlob = 'src/js/individual/**/*.js',
	jsCombinedGlob = 'src/js/combined/**/*.js';

//error notification settings for plumber
var plumberErrorHandler = function(err) {

	console.log( 'plumber error!' );

	notify.onError({
		title: notifyInfo.title,
		message: "Error: <%= err.message %>",
		sound: 'Pop'
	});
	this.emit('end');
};

//processes scripts individually (doesn't combine them)
var jsIndividualScripts = lazypipe()
	.pipe(plumber, {errorHandler: plumberErrorHandler})
	.pipe(newer, { dest: 'html/assets/js', ext: '.min.js' })
	.pipe(gulp.dest, 'html/js')
	.pipe(size, {showFiles: true})
	.pipe(uglify)
	.pipe(rename, { suffix: '.min' })
	.pipe(gulp.dest, 'html/js')
	.pipe(size, {showFiles: true});

//processes scripts collectively (combines them into one file)
var jsCombinedScripts = lazypipe()
	.pipe(plumber, {errorHandler: plumberErrorHandler})
	.pipe(newer, 'html/assets/js/main.min.js')
	.pipe(concat, 'scripts.js')
	.pipe(gulp.dest, 'html/assets/js')
	.pipe(size, {showFiles: true})
	.pipe(uglify)
	.pipe(rename, { suffix: '.min' })
	.pipe(gulp.dest, 'html/assets/js')
	.pipe(size, {showFiles: true});

//processes the scss
var scssProcessing = lazypipe()
	.pipe(plumber, {errorHandler: plumberErrorHandler})
	.pipe(sass, {outputStyle: ':compact'})
	.pipe(autoprefixer, 'last 2 version', 'safari 5', 'ie 7', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4')
	.pipe(gulp.dest, 'html/assets/css')
	.pipe(size, {showFiles: true})
	.pipe(rename, { suffix: '.min' })
	.pipe(minifycss)
	.pipe(gulp.dest, 'html/assets/css')
	.pipe(size, {showFiles: true});

//styles task
gulp.task('styles', function() {
	return gulp.src('src/scss/master.scss').pipe(scssProcessing());
});

//scripts individual task
gulp.task('scripts-individual', function() {
	return gulp.src(jsIndividualGlob).pipe(jsIndividualScripts());
});

//scripts combined task
gulp.task('scripts-combined', function() {
	return gulp.src(jsCombinedGlob).pipe(jsCombinedScripts());
});

//watch task
gulp.task('default', function() {
	livereload.listen();

	//watch all .scss files
	gulp.watch(scssGlob, ['styles']);

	//watch each individual .js file
	watch(jsIndividualGlob).pipe(jsIndividualScripts());

	//watch all combined .js files
	gulp.watch(jsCombinedGlob, ['scripts-combined']);

	//watch for changes on transpired templates, css, and js files
	gulp.watch([
		'craft/templates/**/*.html',
		'html/assets/js/**/*.min.js',
		'html/assets/css/**/*.min.css'
	], function(event) {
		gulp.src(event.path)
			.pipe(plumber())
			.pipe(livereload())
			.pipe(notify({
				title: notifyInfo.title,
				icon: notifyInfo.icon,
				message: event.type + ': ' + event.path.replace(__dirname, '').replace(/\\/g, '/') + ' was reloaded',
				sound: 'Pop'
			})
		);
	});
});

//default task - one time styles and scripts
gulp.task('build', ['styles', 'scripts-individual', 'scripts-combined']);