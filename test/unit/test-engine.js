// jshint ignore: start
largeModule('Engine', TestEnv);

var tolerance = 0.01;   // Ticker获取当前时间时，就算是同一帧也可能拿到不同的时间，因为每行代码都有时间开销。

test('basic state transition', function() {
    strictEqual(Engine.isPlaying, false, 'init state');
    strictEqual(Engine.isPaused, false, 'init state');

    Engine.play();
    strictEqual(Engine.isPlaying, true, 'stop to play, not paused');
    strictEqual(Engine.isPaused, false, 'stop to play, not paused');

    Engine.pause();
    strictEqual(Engine.isPlaying, true, 'play to pause');
    strictEqual(Engine.isPaused, true, 'play to pause');

    Engine.play();
    strictEqual(Engine.isPlaying, true, 'pause to play');
    strictEqual(Engine.isPaused, false, 'pause to play');

    Engine.stop();
    strictEqual(Engine.isPlaying, false, 'play to stop');
    strictEqual(Engine.isPaused, false, 'play to stop');

    Engine.pause();
    strictEqual(Engine.isPlaying, false, 'paused and stop');
    strictEqual(Engine.isPaused, true, 'paused and stop');

    Engine.play();
    strictEqual(Engine.isPlaying, true, 'stop to play, paused');
    strictEqual(Engine.isPaused, true, 'stop to play, paused');
});

test('step state transition', function() {
    Engine.stop();
    strictEqual(Engine.isPlaying, false, 'reset states');
    strictEqual(Engine.isPaused, false, 'reset states');

    Engine.step();
    strictEqual(Engine.isPlaying, true, 'stop to step, not paused before');
    strictEqual(Engine.isPaused, true, 'stop to step, not paused before');

    Engine.pause();
    strictEqual(Engine.isPlaying, true, 'state should not changed if step to pause');
    strictEqual(Engine.isPaused, true, 'state should not changed if step to pause');

    Engine.play();

    Engine.step();
    strictEqual(Engine.isPlaying, true, 'play to step');
    strictEqual(Engine.isPaused, true, 'play to step');

    Engine.play();
    strictEqual(Engine.isPlaying, true, 'step to play');
    strictEqual(Engine.isPaused, false, 'step to play');

    Engine.pause();

    Engine.step();
    strictEqual(Engine.isPlaying, true, 'state should not changed if pause to step');
    strictEqual(Engine.isPaused, true, 'state should not changed if pause to step');

    Engine.step();
    strictEqual(Engine.isPlaying, true, 'state should not changed if step to step');
    strictEqual(Engine.isPaused, true, 'state should not changed if step to step');
});

asyncTest('stop -> play -> stop', function () {
    TestOnly.update = function (updateLogic) {
        // first frame
        close(Time.time, 0, tolerance, 'reset Time');
        close(Time.realTime, 0, tolerance, 'reset Time');
        strictEqual(Time.frameCount, 1, 'reset Time');
        strictEqual(updateLogic, true, 'update logic');

        TestOnly.update = function (updateLogic) {
            // second frame
            ok(Time.time >= 0);     // time may not changed, not sure but perhaps it is caused by
            ok(Time.realTime >= 0); // play just triggered before browser's render tick.
            strictEqual(Time.frameCount, 2, 'second frame');
            strictEqual(updateLogic, true, 'update logic');

            TestOnly.update = function (updateLogic) {
                // third frame
                ok(Time.time > 0, 'time should elapsed between at least 2 frame. Time.time: ' + Time.time);
                ok(Time.realTime > 0, 'time should elapsed between at least 2 frame. Time.realTime:' + Time.realTime);
                strictEqual(Time.frameCount, 3, 'third frame');
                strictEqual(updateLogic, true, 'update logic');

                TestOnly.update = function () {
                    ok(false, 'should not update after stopped');
                };

                Engine.stop();

                setTimeout(function () {
                    asyncEnd();
                }, 30);
            }
        };
    };
    Engine.play();
});

asyncTest('stop -> play -> stop, all in 1 frame', 4, function () {
    TestOnly.update = function (updateLogic) {
        // first frame
        close(Time.time, 0, tolerance, 'reset time');
        close(Time.realTime, 0, tolerance, 'reset realTime');
        strictEqual(Time.frameCount, 1, 'reset frameCount');
        strictEqual(updateLogic, true, 'update logic');

        TestOnly.update = function () {
            ok(false, 'should not update after stopped');
        };
    };
    Engine.play();
    Engine.stop();

    setTimeout(function () {
        asyncEnd();
    }, 30);
});

asyncTest('play -> pause -> play', function () {
    TestOnly.update = function (updateLogic) {
        // frame 1
        TestOnly.update = function () {
            // frame 2
            var lastTime = Time.time;
            var lastRealTime = Time.realTime;
            var lastFrame = Time.frameCount;

            TestOnly.update = function (updateLogic) {
                // frame 3
                strictEqual(updateLogic, false, 'should not update logic if paused');

                strictEqual(Time.time, lastTime, 'time unchaned');
                ok(Time.realTime > lastRealTime, 'real time elpased');
                strictEqual(Time.frameCount, lastFrame, 'time unchaned');

                asyncEnd();
            };

            Engine.pause();
        };
    };
    Engine.play();
});

asyncTest('stop -> step -> step', function () {
    TestOnly.update = function (updateLogic) {
        // render frame 1, step frame 1
        strictEqual(updateLogic, true, 'should updateLogic in first frame');
        var lastTime = Time.time;
        var lastRealTime = Time.realTime;
        var lastFrame = Time.frameCount;
        //Fire.log('Ticker.now() ' + Ticker.now());

        TestOnly.update = function (updateLogic) {
            // render frame 2, step frame 1
            strictEqual(updateLogic, false, 'should not update logic between steps');
            strictEqual(Time.time, lastTime, 'time unchaned between steps');
            ok(Time.realTime >= lastRealTime);
            strictEqual(Time.frameCount, lastFrame, 'frame count unchaned between steps');

            TestOnly.update = function (updateLogic) {
                // render frame 3, step frame 2
                strictEqual(updateLogic, true, 'should update logic if stepping');
                ok(Time.time > lastTime, 'time elapsed');
                //Fire.log('Ticker.now() ' + Ticker.now());
                ok(Time.realTime > lastRealTime, 'real time should elpased between at least 2 frame');
                strictEqual(Time.frameCount, lastFrame + 1, 'frame increased');

                asyncEnd();
            };

            Engine.step();
        };
    };
    Engine.step();
});

// jshint ignore: end


