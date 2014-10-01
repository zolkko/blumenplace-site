var gulp = require('gulp'),
    run = require('gulp-run'),
    source = require('vinyl-source-stream'),
    clean = require('gulp-clean'),
    path = require('path'),
    sass = require('gulp-sass'),
    minifyHTML = require('gulp-minify-html'),
    autoprefixer = require('gulp-autoprefixer'),
    minifycss = require('gulp-minify-css'),
    rename = require('gulp-rename'),
    argv = require('yargs').argv;


var srcDir = __dirname,
    srcScssDir = path.join(srcDir, 'scss/*.scss'),
    dstDir = argv.o ? argv.o : path.join(__dirname, 'build'),
    dstCssDir = path.join(dstDir, 'css');


gulp.task('clean', function () {
    gulp.src(path.join(dstDir, '**', '*.html'), {read: false})
        .pipe(clean());

    gulp.src(path.join(dstDir, '**', '*.js'), {read: false})
        .pipe(clean());

    gulp.src(path.join(dstDir, '**', '*.css'), {read: false})
        .pipe(clean());
});


gulp.task('build-sass', function () {
    gulp.src(srcScssDir)
        .pipe(sass())
        .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1'))
        .pipe(rename({suffix: '.min'}))
        .pipe(minifycss())
        .pipe(gulp.dest(dstCssDir));
});


gulp.task('build-html', function () {
    gulp.src(path.join(srcDir, 'index.html'))
        .pipe(minifyHTML({quotes: true}))
        .pipe(gulp.dest(dstDir))
});


gulp.task('default', ['build-html', 'build-sass'], function () {
});

