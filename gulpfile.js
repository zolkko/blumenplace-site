var path = require('path'),
    options = parseArguments(),
    markdown = require('markdown'),
    handlebars = require('handlebars');

var gulp = require('gulp'),
    source = require('vinyl-source-stream'),
    sass = require('gulp-sass'),
    minifyHTML = require('gulp-minify-html'),
    autoprefixer = require('gulp-autoprefixer'),
    minifycss = require('gulp-minify-css'),
    rename = require('gulp-rename'),
    connect = require('gulp-connect');

var srcDir = __dirname,
    srcMd = path.join(srcDir, 'src', '**', '*.md'),
    srcTpl = path.join(srcDir, 'templates', '*.html'),
    srcScss = path.join(srcDir, 'scss', '*.scss'),
    srcSvg = path.join(srcDir, 'img', '*.svg'),
    srcPng = path.join(srcDir, 'img', '**', '*.png'),
    dstDir = options.buildDir,
    dstCssDir = path.join(dstDir, 'css'),
    dstImgDir = path.join(dstDir, 'img');


handlebars.registerHelper('limit', function(collection, limit, start) {
    var out = [], i, c;
    start = start || 0;
    for (i = c = 0; i < collection.length; i++) {
        if (i >= start && c < limit+1) {
            out.push(collection[i]);
            c++;
        }
    }
    return out;
});


handlebars.registerHelper('formatDate', function (date) {
    return date.toLocaleDateString();
});


function parseArguments() {
    var buildDir = path.join(__dirname, 'build'),
        remoteHost = 'example.com',
        remoteDir = '/var/www';

    var optparse = require('optparse'),
        switches = [
            ['--build-dir', 'Build output directory'],
            ['--host', 'Remote host name to deploy to'],
            ['--remote-dir', 'Remote host directory to copy build files to'],
            ['-h', '--help', 'Display this help']
        ],
        parser = new optparse.OptionParser(switches);

    parser.on('build-dir', function(value) {
        buildDir = value;
    });

    parser.on('host', function (value) {
        remoteHost = value;
    });

    parser.on('remote-dir', function (value) {
        remoteDir = value;
    });

    parser.on('help', function () {
        console.log('Usage: gulp [command] [argument=value]');
        console.log('Available options:');

        var tmp;
        for (var i in switches) {
            if (switches[i].length == 2) {
                console.log('\t', switches[i][0], '\t', switches[i][1]);
            } else if (switches[i].length == 3) {
                console.log('\t', switches[i][0], ', ', switches[i][1], '\t', switches[i][2]);
            }
        }

        console.log('\nSupported commands: build, connect and deplay.');

        process.exit();
    });

    parser.parse(process.argv);

    return {
        buildDir: buildDir,
        remoteHost: remoteHost,
        remoteDir: remoteDir
    }
}


gulp.task('clean', function (cb) {
    var del = require('del');

    del([
        path.join(dstDir, '**', '*.html'),
        path.join(dstDir, '**', '*.js'),
        path.join(dstDir, '**', '*.css'),
    ], cb);
});


gulp.task('build-sass', function () {
    gulp.src(srcScss)
        .pipe(sass())
        .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1'))
        .pipe(rename({suffix: '.min'}))
        .pipe(minifycss())
        .pipe(gulp.dest(dstCssDir));
});


gulp.task('build-html', function () {
    var gulpsmith = require('gulpsmith'),
        gulpFrontMatter = require('gulp-front-matter'),
        metalMd = require('metalsmith-markdown'),
        metalTpl = require('metalsmith-templates'),
        collections = require('metalsmith-collections'),
        paginate = require('metalsmith-paginate'),
        permalinks = require('metalsmith-permalinks'),
        assign = require('lodash.assign');

    var metalPipe = gulpsmith()
        .metadata({
            remoteHost: options.remoteHost,
            siteRoot: '/',
            staticRoot: '/'
        })
        .use(collections({
            recent: {
                pattern: 'blog/*.md',
                sortBy: 'date',
                reverse: true,
                limit: 2,
            },
            posts: {
                pattern: 'blog/*.md',
                sortBy: 'date',
                reverse: true
            }
        }))
        .use(paginate({
            perPage: 1,
            path: 'blog/page'
        }))
        .use(metalMd({
            gfm: true
        }))
        .use(permalinks({
            pattern: 'blog/:date/:title'
        }))
        .use(metalTpl({
            engine: 'handlebars',
            inPlace: false,
            data: {
                intl: {
                    'locales': 'en-US'
                }
            },
            partials: {
                'head': '_head',
                'syntax-header': '_syntax-header',
                'head-line': '_head-line',
                'header': '_header',
                'main-menu': '_main-menu',
                'foot-line': '_foot-line'
            }
        }));

    gulp.src(srcMd)
        .pipe(gulpFrontMatter()).on('data', function(file) {
            var contents, contentsString, excerpt, index;

            assign(file, file.frontMatter);
            delete file.frontMatter;

            if (file.excerpt === undefined) {
                contents = file.contents;
                contentsString = contents.toString();
                index = contentsString.search(/<!--\s*cut\s*-->/);

                if (index > -1) {
                    excerpt = contents.slice(0, Buffer.byteLength(contentsString.slice(0, index)));
                } else {
                    excerpt = contents;
                }

                if (path.extname(file.path) === '.md' && excerpt) {
                    excerpt = markdown.parse(excerpt.toString());
                }
            }

            file['excerpt'] = excerpt;
        })
        .pipe(metalPipe)
        .pipe(minifyHTML({quotes: true}))
        .pipe(gulp.dest(dstDir))
        .pipe(connect.reload());
});


gulp.task('build-img', function () {
    gulp.src(srcSvg)
        .pipe(gulp.dest(dstImgDir))
        .pipe(connect.reload());

    gulp.src(srcPng)
        .pipe(gulp.dest(dstImgDir))
        .pipe(connect.reload());
});


gulp.task('watch', function () {
    gulp.watch([srcMd, srcTpl], ['build-html']);
    gulp.watch([srcScss], ['build-sass']);
    gulp.watch([srcSvg], ['build-img']);
});


gulp.task('connect', ['watch'], function () {
    connect.server({
        root: dstDir,
        port: 9495,
        livereload: true
    });
});


gulp.task('default', ['build-html', 'build-sass', 'build-img'], function () {
});

