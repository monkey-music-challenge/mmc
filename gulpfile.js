var gulp = require('gulp'),
    browserify = require('gulp-browserify'),
    sass = require('gulp-sass'),
    minify = require('gulp-minify-css'),
    gutil = require('gulp-util'),
    prefixer = require('gulp-autoprefixer');

var paths = {
  scss: 'stylesheets/**/*.scss',
  css: 'public/css',
  scripts: ['client/**/*.js'],
  config: ['./*.json', 'client/**/*.json'],
  versusMain: ['client/versus.js'],
  bossMain: ['client/boss.js'],
  editorMain: ['client/editor.js'],
  manualMain: ['client/manual.js']
};

var buildCSS = function() {
  return gulp.src(paths.scss)
    .pipe(sass({
      errLogToConsole: true
    }))
    .pipe(prefixer())
    .pipe(minify({ cache: true }))
    .pipe(gulp.dest(paths.css));
};

var buildJS = function(main) {
  return gulp.src(main)
    .pipe(browserify({
      debug: true
    }))
    .on('error', gutil.log)
    .pipe(gulp.dest('public'));
};

gulp.task('css', buildCSS);
gulp.task('versus', buildJS.bind(null, paths.versusMain));
gulp.task('boss', buildJS.bind(null, paths.bossMain));
gulp.task('editor', buildJS.bind(null, paths.editorMain));
gulp.task('manual', buildJS.bind(null, paths.manualMain));

// Rerun the task when a file changes
gulp.task('watch', function() {
  gulp.watch(paths.scss, ['css']);
  gulp.watch(paths.scripts, ['versus']);
  gulp.watch(paths.scripts, ['boss']);
  gulp.watch(paths.scripts, ['editor']);
  gulp.watch(paths.scripts, ['manual']);
});

// The default task (called when you run `gulp` from cli)
gulp.task('default', ['versus', 'boss', 'css', 'editor', 'manual']);
