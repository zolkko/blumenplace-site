var thumbnail = {
    threshold: 320,
    width: 640,
    suffix: '.thumbnail'
};

var path = require('path'),
    options = parseArguments(),
    handlebars = require('handlebars'),
    marked = require('marked');

var gulp = require('gulp'),
    sass = require('gulp-ruby-sass'),
    minifyHTML = require('gulp-minify-html'),
    autoprefixer = require('gulp-autoprefixer'),
    minifycss = require('gulp-minify-css'),
    connect = require('gulp-connect'),
    merge = require('gulp-merge'),
    rename = require('gulp-rename'),
    resize = require('gulp-image-resize'),
    gulpif = require('gulp-if'),
    concat = require('gulp-concat'),
    imageSize = require('image-size'),
    source = require('vinyl-source-stream'),
    lazypipe = require('lazypipe');

var srcDir = __dirname,
    srcMd = path.join(srcDir, 'src', '**', '*.md'),
    srcTpl = path.join(srcDir, 'templates', '*.html'),
    srcScss = path.join(srcDir, 'scss', '*.scss'),
    srcSvg = path.join(srcDir, 'img', '**', '*.svg'),
    srcPng = path.join(srcDir, 'img', '**', '*.png'),
    srcBlogPng = path.join(srcDir, 'img', 'blog', '**', '*.png'),
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


function markdownImage(href, title, text) {
    var fs = require('fs'),
        url, filePath, fileName, fileExt, fileBaseName, thumbUrl, out;

    if (href.indexOf('/img/blog/') === 0) {
        url = href.split('/');
        filePath = path.join.apply(null, [srcDir].concat(url));

        if (fs.existsSync(filePath) && imageSize(filePath).width > thumbnail.threshold) {
            fileName = url[url.length - 1];
            fileExt = path.extname(fileName);
            fileBaseName = path.basename(fileName, fileExt);

            thumbUrl = url.slice(0, url.length - 1);
            thumbUrl.push(fileBaseName + thumbnail.suffix + fileExt);

            out = '<a href="' + href + '"><img src="' + thumbUrl.join('/') + '" alt="' + text + '"';
            if (title) {
                out += ' title="' + title + '"';
            }
            return out + (this.options.xhtml ? '/></a>' : '></a>');
        }
    }

    out = '<img src="' + href + '" alt="' + text + '"';
    if (title) {
        out += ' title="' + title + '"';
    }
    return out + (this.options.xhtml ? '/>' : '>');
}


function parseArguments() {
    var buildDir = path.join(__dirname, 'build');

    var optparse = require('optparse'),
        switches = [
            ['-o', '--build-dir [VALUE]', 'Build output directory'],
            ['-h', '--help', 'Display this help']
        ],
        parser = new optparse.OptionParser(switches);

    parser.on('build-dir', function(passed, value) {
        buildDir = value.trim();
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

        console.log('\nSupported commands: build, build-* and connect.');

        process.exit();
    });

    parser.parse(process.argv);

    return {
        buildDir: buildDir
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
    var sassFile = sass('scss/')
        .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1'));

    var hljFile = gulp.src([
        'node_modules/gulp-highlight/node_modules/highlight.js/styles/github.css'
    ]);

    merge(sassFile, hljFile)
        .pipe(minifycss())
        .pipe(concat('blumenplace.min.css'))
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
        assign = require('lodash.assign'),
        hljs = require('highlight.js');

    var renderer = new marked.Renderer();
    renderer.image = markdownImage;

    var markedOptions = {
        gfm: true,
        highlight: function (code, lang) {
            return hljs.highlightAuto(code, [lang]).value;
        },
        renderer: renderer
    };

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
            perPage: 10,
            path: 'blog/page'
        }))
        .use(metalMd(markedOptions))
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
                'header': '_header',
                'main-menu': '_main-menu',
                'footer': '_footer',
                'disq': '_disq',
                'like-script': '_fblike'
            }
        }));

    gulp.src(srcMd)
        .pipe(gulpFrontMatter()).on('data', function(file) {
            var contents, contentsString, excerpt, index, $;

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
                    excerpt = marked(excerpt.toString(), markedOptions);
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
    var thumbnailPipe = lazypipe()
        .pipe(rename, {suffix: thumbnail.suffix})
        .pipe(resize, {
            width: thumbnail.width,
            crop: false,
            upscale: false,
            imageMagick: true
        });

    gulp.src(srcSvg)
        .pipe(gulp.dest(dstImgDir))
        .pipe(connect.reload());

    gulp.src(srcPng)
        .pipe(gulp.dest(dstImgDir))
        .pipe(gulpif(function (file) {
            return file.path.indexOf(path.join(srcDir, 'img', 'blog')) !== 0 && imageSize(file.path).width > thumbnail.threshold;
        }, thumbnailPipe()))
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

