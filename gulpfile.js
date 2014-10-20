var gulp = require('gulp'),
    run = require('gulp-run'),
    source = require('vinyl-source-stream'),
    path = require('path'),
    sass = require('gulp-sass'),
    minifyHTML = require('gulp-minify-html'),
    autoprefixer = require('gulp-autoprefixer'),
    minifycss = require('gulp-minify-css'),
    rename = require('gulp-rename'),
    argv = require('yargs').argv,
    fileinclude = require('gulp-file-include'),
    markdown = require('markdown'),
    del = require('del'),
    connect = require('gulp-connect');


var srcDir = __dirname,
    srcScssDir = path.join(srcDir, 'scss/*.scss'),
    srcHtmlDir = path.join(srcDir, '*.html'),
    srcSvgDir = path.join(srcDir, 'img/*.svg'),
    dstDir = argv.o ? argv.o : path.join(__dirname, 'build'),
    dstCssDir = path.join(dstDir, 'css'),
    dstImgDir = path.join(dstDir, 'img');


gulp.task('clean', function (cb) {
    del([
        path.join(dstDir, '**', '*.html'),
        path.join(dstDir, '**', '*.js'),
        path.join(dstDir, '**', '*.css'),
    ], cb);
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
    gulp.src(path.join(srcDir, '*.html'))
        .pipe(fileinclude({
            prefix: '@@',
            basepath: '@file',
            filters: {
                markdown: markdown.parse
            }
        }))
        .pipe(minifyHTML({quotes: true}))
        .pipe(gulp.dest(dstDir))
        .pipe(connect.reload());
});


gulp.task('build-img', function () {
    gulp.src(srcSvgDir)
        .pipe(gulp.dest(dstImgDir))
        .pipe(connect.reload());
});


gulp.task('watch', function () {
    gulp.watch([srcHtmlDir], ['build-html']);
    gulp.watch([srcScssDir], ['build-sass']);
    gulp.watch([srcSvgDir], ['build-img']);
});


gulp.task('connect', ['watch'], function () {
    connect.server({
        root: 'build',
        port: 8085,
        livereload: true
    });
});


gulp.task('default', ['build-html', 'build-sass', 'build-img'], function () {
});

