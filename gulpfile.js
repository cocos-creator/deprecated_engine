var Path = require('path');
var es = require('event-stream');
var stylish = require('jshint-stylish');
var fs = require('fs');
//var through = require('through');

var gulp = require('gulp');
var concat = require('gulp-concat');
var gutil = require('gulp-util');
var jshint = require('gulp-jshint');
var qunit = require('gulp-qunit');
var rename = require('gulp-rename');
var uglify = require('gulp-uglifyjs');
var preprocess = require('gulp-preprocess');
var header = require('gulp-header');

var fb = require('gulp-fb');
var del = require('del');

var paths = {
    // source
    src: [
        // runtime pre-defines
        'src/platform/editor/misc.js',
        'src/platform/editor/asset-watcher.js',
        'src/platform/editor/editor-callbacks.js',

        // mockers for editor-core
        'src/platform/editor-core/**/*',

        // runtime engine
        'src/definition.js',
        'src/utils.js',
        'src/runtime.js',
        'src/time.js',
        'src/event/event.js',
        'src/event/event-listeners.js',
        'src/event/event-target.js',
        'src/playable.js',
        'src/platform/h5/ticker.js',
        'src/render-context.js',
        'src/animation/animation-data-types.js',
        'src/animation/animator.js',
        'src/animation/animation-manager.js',
        'src/platform/h5/loaders.js',
        'src/platform/h5/engine.js',
        'src/platform/h5/timer.js',
        'src/entity.js',
        'src/component/base/component.js',
        'src/component/base/component-requiring-frames.js',
        'src/component/base/component-define.js',
        'src/component/transform.js',
        'src/component/renderer.js',
        'src/component/sprite-renderer.js',
        'src/component/bitmap-text.js',
        'src/component/text.js',
        'src/component/input-field.js',
        'src/component/particle-system/cocos-particle-system.js',
        'src/component/particle-system/particle-system.js',
        'src/component/camera.js',
        'src/component/missing.js',
        'src/component/animation.js',
        'src/interaction-context.js',
        'src/scene.js',
        'src/load-manager.js',
        'src/asset-library.js',
        'src/resources.js',
        'src/platform/h5/input-events.js',
        'src/platform/h5/input-context.js',
        'src/platform/h5/browser.js',
        'src/platform/h5/screen.js',
        'src/platform/h5/screen–agnostic.js',
        'src/event/event-register.js',
        'src/input.js',

        'src/audio/audio-fix-ios.js',
        'src/audio/audio-legacy.js',
        'src/audio/audio-source.js',
        'src/audio/audio-web-audio.js',

        'src/spine/atlas-asset.js',
        'src/spine/skeleton-data-asset.js',
        'src/spine/spine-runtime.js',
        'src/spine/skeleton-renderer.js',
        'src/spine/skeleton.js',
        'src/spine/import-assets.js',
    ],
    index: 'src/index.js',

    // ext
    ext_core: '../core/bin/**/core.js',

    // test
    test: {
        src: 'test/unit/**/*.js',
        runner: 'test/lib/runner.html',
        lib_dev: [
            'ext/fire-core/bin/dev/core.js',
            'bin/dev/engine.js',
        ],
        lib_min: [
            'ext/fire-core/bin/min/core.js',
            'bin/min/engine.js',
        ],
    },

    // output
    output: 'bin/',
    output_dev: 'bin/dev/',
    output_min: 'bin/min/',
    engine_dev: 'engine.js',
    engine_min: 'engine.js',
    engine_player_dev: 'engine.player.dev.js',
    engine_player: 'engine.player.js',
    engine_editor_core: 'engine.editor-core.js',

    // references
    ref: {
        src: [
            'ext/pixi/bin/pixi.dev.js',
            'ext/fire-core/bin/dev/core.js',
            'test/lib/*.js',
            'test/unit/_*.js',
        ],
        dest: '_references.js',
    },
};

/////////////////////////////////////////////////////////////////////////////
// copy
/////////////////////////////////////////////////////////////////////////////

// copy local core to ext for rapid test
gulp.task('cp-core', function() {
    return gulp.src(paths.ext_core, { base: '../core' })
               .pipe(gulp.dest('ext/fire-core'));
});

/////////////////////////////////////////////////////////////////////////////
// build
/////////////////////////////////////////////////////////////////////////////

//var insertCoreShortcut = function (path, moduleName, filter) {
//    var finished = false;
//    filter = filter || function (key) {
//        return this[key].prototype && this[key].prototype.__classname__;
//    };
//    function createShortcut(path, moduleName, filter) {
//        var m = require(path);
//        var keys = Object.getOwnPropertyNames(m);
//        var code = '';
//
//        if ('readable') {
//            for (var i = 0; i < keys.length; i++) {
//                var key = keys[i];
//                if (filter.call(m, key)) {
//                    code += 'var ' + key + ' = ' + moduleName + '.' + key + ';\n';
//                }
//            }
//        }
//        else {
//            code =
//"// declare shortcuts of core\n\
//(function () {\n\
//    var shortcuts = '" + keys.filter(filter, m).join(',') + "'.split(',');\n\
//    for (var i = 0; i < shortcuts.length; i++) {\n\
//        this[shortcuts[i]] = " + moduleName + "[shortcuts[i]];\n\
//    }\n\
//})();\n";
//        }
//        return code;
//    }
//    function write(file) {
//        if (file.isStream()) return this.emit('error', new gutil.PluginError('insertCoreShortcut', 'Streaming not supported'));
//        if (!finished) {
//            var shortcut = file.clone();
//            shortcut.contents = new Buffer(createShortcut(path, moduleName, filter));
//            this.emit('data', shortcut);
//            finished = true;
//        }
//        this.emit('data', file);
//    }
//    return through(write);
//};

gulp.task('js-dev', function() {
    return gulp.src(paths.src.concat('!**/platform/editor-core/**'))
               // .pipe(insertCoreShortcut('./ext/fire-core/bin/core.min.js', 'Fire'))
               .pipe(jshint({
                   multistr: true,
                   smarttabs: false,
                   loopfunc: true,
               }))
               .pipe(jshint.reporter(stylish))
               .pipe(concat(paths.engine_dev))
               .pipe(fb.wrapModule(paths.index))
               .pipe(preprocess({context: { EDITOR: true, DEBUG: true, DEV: true }}))
               .pipe(gulp.dest(paths.output_dev))
               ;
});

gulp.task('js-min', function() {
    return gulp.src(paths.src.concat('!**/platform/editor-core/**'))
    // .pipe(insertCoreShortcut('./ext/fire-core/bin/core.min.js', 'Fire'))
        .pipe(concat(paths.engine_min))
        .pipe(fb.wrapModule(paths.index))
        .pipe(preprocess({context: { EDITOR: true, DEV: true }}))
        .pipe(uglify({
            compress: {
                dead_code: false,
                unused: false
            }
        }))
        .pipe(gulp.dest(paths.output_min))
        ;
});

gulp.task('js-player-dev', function() {
    return gulp.src(paths.src.concat('!**/platform/{editor|editor-core}/**'))
        // .pipe(insertCoreShortcut('./ext/fire-core/bin/core.min.js', 'Fire'))
        .pipe(concat(paths.engine_player_dev))
        .pipe(preprocess({context: { PLAYER: true, DEBUG: true, DEV: true }}))
        .pipe(gulp.dest(paths.output))
        ;
});

gulp.task('js-player', function() {
    return gulp.src(paths.src.concat('!**/platform/{editor|editor-core}/**'))
        // .pipe(insertCoreShortcut('./ext/fire-core/bin/core.min.js', 'Fire'))
        .pipe(concat(paths.engine_player))
        .pipe(preprocess({context: { PLAYER: true }}))
        .pipe(gulp.dest(paths.output))
        ;
});

gulp.task('js-editor-core', function() {
    return gulp.src(paths.src.concat('!**/platform/h5/**'))
        // .pipe(insertCoreShortcut('./ext/fire-core/bin/core.min.js', 'Fire'))
        .pipe(concat(paths.engine_editor_core))
        .pipe(fb.wrapModule(paths.index))
        .pipe(preprocess({context: { EDITOR: true, EDITOR_CORE: true, DEBUG: true, DEV: true }}))
        .pipe(gulp.dest(paths.output))
        ;
});

gulp.task('js-all', ['js-dev', 'js-min', 'js-player-dev', 'js-player', 'js-editor-core']);

/////////////////////////////////////////////////////////////////////////////
// test
/////////////////////////////////////////////////////////////////////////////

gulp.task('unit-runner', function() {
    var js = paths.test.src;
    var dest = paths.test.src.split('*')[0];
    return gulp.src(js, { read: false, base: './' })
               .pipe(fb.toFileList())
               .pipe(fb.generateRunner(paths.test.runner,
                                         dest,
                                         'Fire Engine Test Suite',
                                         paths.test.lib_min,
                                         paths.test.lib_dev,
                                         paths.src))
               .pipe(gulp.dest(dest))
               ;
});

gulp.task('test', ['cp-core', 'js-min', 'js-dev', 'unit-runner'], function() {
    gutil.log("please run " + gutil.colors.green("'bower install'") + " before running this task.");
    var timeOutInSeconds = 5;
    return gulp.src('test/unit/runner.html', { read: false })
               //.pipe(fb.callback(function () {
               //    // launch server
               //    require('./test/server.js');
               //}))
               .pipe(qunit({ timeout: timeOutInSeconds }))
               //.on('error', function(err) {
               //    // Make sure failed tests cause gulp to exit non-zero
               //    throw err;
               //})
               ;
});

/////////////////////////////////////////////////////////////////////////////
// tasks
/////////////////////////////////////////////////////////////////////////////

// clean
gulp.task('clean', function(cb) {
    del('bin/', cb);
});

// ref
gulp.task('ref', ['cp-core'], function() {
    var files = paths.ref.src.concat(paths.src);
    var destPath = paths.ref.dest;
    return fb.generateReference(files, destPath);
});

// doc
gulp.task('export-api-syntax', function (done) {

    // 默认所有 engine 模块都在 Fire 下面
    var DefaultModuleHeader = "/**\n" +
                              " * @module Fire\n" +
                              " */\n";
    var dest = '../../utils/api/engine';

    del(dest + '/**/*', { force: true }, function (err) {
        if (err) {
            done(err);
            return;
        }

        gulp.src(paths.src)
            .pipe(header(DefaultModuleHeader))
            .pipe(gulp.dest(dest))
            .on('end', done);
    });
});

// watch
gulp.task('watch', function() {
    gulp.watch(paths.src.concat(paths.index), ['default']).on ( 'error', gutil.log );
});

// tasks
gulp.task('min', ['js-min', 'js-player-dev', 'js-player', 'js-editor-core']);
gulp.task('dev', ['js-dev', 'js-player-dev', 'js-player', 'js-editor-core']);
gulp.task('all', ['dev', 'test', 'ref'] );
gulp.task('ci', ['test'] );
gulp.task('default', ['dev', 'min']);
