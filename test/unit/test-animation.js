largeModule('Animation', TestEnv);

test('computeNullOffsets', function () {
    var computeNullOffsets = TestOnly.computeNullOffsets;
    var computedOffset;
    var keyFrames;

    // smoke tests
    keyFrames = [ { offset: 0.1 } ];
    computeNullOffsets([]);
    computeNullOffsets(keyFrames);
    strictEqual(keyFrames[0].offset, 0.1, 'should not change exists offset');
    computedOffset = keyFrames[0].computedOffset;
    ok(computedOffset === 0.1 || computedOffset === undefined, 'computedOffset should == offset if presented');
    //
    keyFrames = [ {} ];
    computeNullOffsets(keyFrames);
    strictEqual(keyFrames[0].offset, undefined, 'should not modify keyFrames');
    strictEqual(keyFrames[0].computedOffset, 0, 'computedOffset should be 0 if only one frame');

    keyFrames = [ {}, {} ];
    computeNullOffsets(keyFrames);
    strictEqual(keyFrames[0].computedOffset, 0, 'computedOffset should be 0 on first frame');
    strictEqual(keyFrames[1].computedOffset, 1, 'computedOffset should be 1 on last frame');

    keyFrames = [ {}, {}, {}, {} ];
    computeNullOffsets(keyFrames);
    strictEqual(keyFrames[1].computedOffset, 1 / 3, 'computedOffset should be 1/3 to make the difference between subsequent keyframe offsets are equal');
    strictEqual(keyFrames[2].computedOffset, 2 / 3, 'computedOffset should be 2/3 to make the difference between subsequent keyframe offsets are equal');

    keyFrames = [ {offset: 0}, {}, {offset: 0.5} ];
    computeNullOffsets(keyFrames);
    strictEqual(keyFrames[1].computedOffset, 0.25, 'computedOffset should be 0.25 to make the difference between subsequent keyframe offsets are equal');
});

asyncTest('EntityAnimator.animate', function () {
    var EntityAnimator = TestOnly.EntityAnimator;
    var entity = new Entity();
    var renderer = entity.addComponent(Fire.SpriteRenderer);

    Engine.play();

    var animator = new EntityAnimator(entity);
    var animation = animator.animate([
        {
            'Fire.Transform': { position: v2(50, 100), scaleX: 10 },
            'Fire.SpriteRenderer': { color: Color.white }
        },
        {
            'Fire.Transform': { position: v2(100, 50), scaleX: 20 },
            'Fire.SpriteRenderer': { color: color(1, 1, 1, 0) }
        }
    ]);

    var posCurve = animation.curves[0];
    var scaleCurve = animation.curves[1];
    var colorCurve = animation.curves[2];
    strictEqual(animation.curves.length, 3, 'should create 3 curve');
    strictEqual(posCurve.target, entity.transform, 'target of posCurve should be transform');
    strictEqual(posCurve.prop, 'position', 'propName of posCurve should be position');
    strictEqual(scaleCurve.target, entity.transform, 'target of scaleCurve should be transform');
    strictEqual(scaleCurve.prop, 'scaleX', 'propName of scaleCurve should be scaleX');
    strictEqual(colorCurve.target, renderer, 'target of colorCurve should be sprite renderer');
    strictEqual(colorCurve.prop, 'color', 'propName of colorCurve should be color');

    deepEqual(posCurve.values, [v2(50, 100), v2(100, 50)], 'values of posCurve should equals keyFrames');
    deepEqual(scaleCurve.values, [10, 20], 'values of scaleCurve should equals keyFrames');
    deepEqual(colorCurve.values, [Color.white, color(1,1,1,0)], 'values of colorCurve should equals keyFrames');

    deepEqual(posCurve.offsets, [0, 1], 'offsets of posCurve should equals keyFrames');
    deepEqual(scaleCurve.offsets, [0, 1], 'offsets of scaleCurve should equals keyFrames');
    deepEqual(colorCurve.offsets, [0, 1], 'offsets of colorCurve should equals keyFrames');

    ok(! entity.transform.position.equals(v2(50, 100)), 'first frame should play until the end of this frame');

    TestOnly.update = function (updateLogic) {
        // end of this frame
        deepEqual(entity.transform.position, v2(50, 100), 'should play first keyFrame at the end of this frame');
        // next frame
        TestOnly.update = function (updateLogic) {
            ok(entity.transform.position.equals(v2(50, 100)) === false, 'should play animation at next frame');
            animator.update(100);
            strictEqual(animator.isUpdating, false, 'animator should not update if non playing animation');
            asyncEnd();
        };
    };
});

test('AnimationNode', function () {
    var entity = new Entity();
    entity.transform.position = v2(321, 891);
    var renderer = entity.addComponent(Fire.SpriteRenderer);

    var animation = entity.animate([
        {
            'Fire.Transform': { position: v2(50, 100), scale: v2(1, 1) },
            'Fire.SpriteRenderer': { color: Color.white }
        },
        {
            'Fire.Transform': { position: v2(100, 50), scale: v2(2, 2) },
            'Fire.SpriteRenderer': { color: color(1, 1, 1, 0) }
        }
    ], {
        delay: 0.3,
        duration: 1.3,
        playbackRate: 0.5,
        iterations: 1.25
    });

    animation.update(0.2);
    deepEqual(entity.transform.position, v2(321, 891), 'should not play animation while delay');

    animation.update(0.2);
    deepEqual(entity.transform.position, v2(50, 100), 'should play first key frame after delay');

    var actualDuration = animation.duration / animation.playbackRate;
    animation.update(actualDuration / 2);
    deepEqual(entity.transform.scale, v2(1.5, 1.5), 'should play second key frame');

    animation.update(actualDuration / 2);
    deepEqual(renderer.color, color(1, 1, 1, 0), 'should play the last key frame');

    animation.update(actualDuration / 4);
    deepEqual(renderer.color, color(1, 1, 1, 0.75), 'should repeat animation');
    strictEqual(animation.isPlaying, false, 'should stop animation');

    animation.update(actualDuration / 4);
    deepEqual(renderer.color, color(1, 1, 1, 0.75), 'should not animate if stopped');
});

test('direction', function () {
    var entity = new Entity();

    var animation = entity.animate([
        {
            'Fire.Transform': { x: 10 },
        },
        {
            'Fire.Transform': { x: 110 },
        }
    ], {
        delay: 0.3,
        duration: 1.3,
        playbackRate: 0.5,
        direction: Fire.PlaybackDirection.reverse,
        iterations: Infinity
    });

    animation.update(0.3);

    var actualDuration = animation.duration / animation.playbackRate;
    animation.update(actualDuration / 4);
    strictEqual(entity.transform.x, 75 + 10, 'should play reversed animation');

    animation.direction = Fire.PlaybackDirection.alternate;
    animation.time = 0;
    animation.update(actualDuration / 4);
    strictEqual(entity.transform.x, 25 + 10, 'should play animation as specified in 0 iteration');
    animation.update(actualDuration * 6);
    close(entity.transform.x, 25 + 10, 0.000001,'should play animation as specified in even iterations');

    animation.time = 0;
    animation.update(actualDuration / 4 + actualDuration);
    strictEqual(entity.transform.x, 75 + 10, 'should played in the reverse direction in odd iterations');
});
