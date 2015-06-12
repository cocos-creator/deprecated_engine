largeModule('Animation', TestEnv);

test('computeNullRatios', function () {
    var computeNullRatios = TestOnly.computeNullRatios;
    var computedRatio;
    var keyFrames;

    // smoke tests
    keyFrames = [ { ratio: 0.1 } ];
    computeNullRatios([]);
    computeNullRatios(keyFrames);
    strictEqual(keyFrames[0].ratio, 0.1, 'should not change exists ratio');
    computedRatio = keyFrames[0].computedRatio;
    ok(computedRatio === 0.1 || computedRatio === undefined, 'computedRatio should == ratio if presented');
    //
    keyFrames = [ {} ];
    computeNullRatios(keyFrames);
    strictEqual(keyFrames[0].ratio, undefined, 'should not modify keyFrames');
    strictEqual(keyFrames[0].computedRatio, 0, 'computedRatio should be 0 if only one frame');

    keyFrames = [ {}, {} ];
    computeNullRatios(keyFrames);
    strictEqual(keyFrames[0].computedRatio, 0, 'computedRatio should be 0 on first frame');
    strictEqual(keyFrames[1].computedRatio, 1, 'computedRatio should be 1 on last frame');

    keyFrames = [ {}, {}, {}, {} ];
    computeNullRatios(keyFrames);
    strictEqual(keyFrames[1].computedRatio, 1 / 3, 'computedRatio should be 1/3 to make the difference between subsequent keyframe ratios are equal');
    strictEqual(keyFrames[2].computedRatio, 2 / 3, 'computedRatio should be 2/3 to make the difference between subsequent keyframe ratios are equal');

    keyFrames = [ {ratio: 0}, {}, {ratio: 0.5} ];
    computeNullRatios(keyFrames);
    strictEqual(keyFrames[1].computedRatio, 0.25, 'computedRatio should be 0.25 to make the difference between subsequent keyframe ratios are equal');
});

asyncTest('EntityAnimator.animate', function () {
    Engine.play();

    var EntityAnimator = TestOnly.EntityAnimator;
    var entity = new Entity();
    var renderer = entity.addComponent(Fire.SpriteRenderer);

    var animator = new EntityAnimator(entity);
    var animation = animator.animate([
        {
            'Fire.Transform': { position: v2(50, 100), scaleX: 10 },
            'Fire.SpriteRenderer': { color: Color.white }
        },
        //{
        //    'Fire.Transform': { position: v2(100, 75) },
        //},
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

    deepEqual(posCurve.ratios, [0, 1], 'ratios of posCurve should equals keyFrames');
    deepEqual(scaleCurve.ratios, [0, 1], 'ratios of scaleCurve should equals keyFrames');
    deepEqual(colorCurve.ratios, [0, 1], 'ratios of colorCurve should equals keyFrames');

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

test('DynamicAnimCurve', function () {
    var DynamicAnimCurve = TestOnly.DynamicAnimCurve;
    var anim = new DynamicAnimCurve();
    var target = {
        height: 1,
        position: v2(123, 456),
        foo: {
            bar: color(0.5, 0.5, 0.5, 0.5),
        }
    };
    anim.target = target;
    anim.prop = 'height';
    anim.values = [10, 100];
    anim.ratios = [0.5, 1.0];
    anim.sample(null, 0.1, null);

    strictEqual(target.height, 10, 'The keyframe value whose ratio is out of ranges should just clamped');

    anim.prop = 'position';
    anim.subProps = ['x'];
    anim.values = [50, 100];
    anim.ratios = [0.0, 1.0];
    anim.sample(null, 0.1, null);

    deepEqual(target.position, v2(55, 456), 'The composed position should animated');

    anim.target = target;
    anim.prop = 'foo';
    anim.subProps = ['bar', 'a'];
    anim.values = [0.5, 1.0];
    anim.ratios = [0.0, 1.0];
    anim.sample(null, 0.1, null);

    deepEqual(target.foo, { bar: color(0.5, 0.5, 0.5, 0.55) }, 'The composed color should animated');
});

test('AnimationNode', function () {
    Engine.play();

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
        speed: 0.5,
        repeatCount: 1.25
    });

    animation.update(0.2);
    deepEqual(entity.transform.position, v2(321, 891), 'should not play animation while delay');

    animation.update(0.2);
    deepEqual(entity.transform.position, v2(50, 100), 'should play first key frame after delay');

    var actualDuration = animation.duration / animation.speed;
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

test('wrapMode', function () {
    Engine.play();

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
        speed: 0.5,
        wrapMode: Fire.WrapMode.Reverse,
        repeatCount: Infinity
    });

    animation.update(0.3);

    var actualDuration = animation.duration / animation.speed;
    animation.update(actualDuration / 4);
    strictEqual(entity.transform.x, 75 + 10, 'should play reversed animation');

    animation.wrapMode = Fire.WrapMode.PingPong;
    animation.time = 0;
    animation.update(actualDuration / 4);
    strictEqual(entity.transform.x, 25 + 10, 'should play animation as specified in 0 iteration');
    animation.update(actualDuration * 6);
    close(entity.transform.x, 25 + 10, 0.000001,'should play animation as specified in even iterations');

    animation.time = 0;
    animation.update(actualDuration / 4 + actualDuration);
    strictEqual(entity.transform.x, 75 + 10, 'should played in the reverse direction in odd iterations');
});

test('createBatchedProperty', function () {
    var createBatchedProperty = TestOnly.createBatchedProperty;

    function test (path, mainValue, animValue) {
        return createBatchedProperty(path, path.indexOf('.'), mainValue, animValue);
    }

    var pos = v2(123, 456);
    var actual = test('position.y', pos, 321);
    ok(actual !== pos, 'should clone a new value');
    deepEqual(actual, v2(123, 321), 'checking value x');

    actual = test('p.x', pos, 321);
    deepEqual(actual, v2(321, 456), 'checking value y');

    var MyValue = Fire.Class({
        extends: Fire.ValueType,
        constructor: function () {
            this.abc = {
                def: {
                    gh: arguments[0]
                }
            };
        },
        clone: function () {
            return new MyValue(this.abc.def.gh);
        }
    });
    var myValue = new MyValue(520);
    actual = test('myValue.abc.def.gh', myValue, 521);
    strictEqual(actual.abc.def.gh, 521, 'checking value gh');
});

test('initClipData', function () {
    var initClipData = TestOnly.initClipData;

    var entity = new Entity();
    var renderer = entity.addComponent(Fire.SpriteRenderer);

    var clip = new Fire.AnimationClip();
    var state = new Fire.AnimationState(clip);
    initClipData(entity, state);
    strictEqual(state.curves.length, 0, 'should create empty animation');

    clip = new Fire.AnimationClip();
    clip._length = 10 / clip.frameRate;
    clip.curveData = [
        {
            component: 'Fire.Transform',
            property: 'position',
            keys: [
                {
                    frame: 0,
                    value: v2(50, 100)
                },
                {
                    frame: 5,
                    value: v2(100, 75)
                },
                {
                    frame: 10,
                    value: v2(100, 50)
                },
            ]
        },
        {
            component: 'Fire.Transform',
            property: 'scale.x',
            keys: [
                {
                    frame: 0,
                    value: 10
                },
                {
                    frame: 10,
                    value: 20
                }
            ]
        },
        {
            component: 'Fire.Transform',
            property: 'scale.y',
            keys: [
                {
                    frame: 0,
                    value: 10
                },
                {
                    frame: 5,
                    value: 12
                },
                {
                    frame: 10,
                    value: 20
                }
            ]
        },
        {
            component: 'Fire.SpriteRenderer',
            property: 'color.a',
            keys: [
                {
                    frame: 0,
                    value: 1
                },
                {
                    frame: 10,
                    value: 0
                }
            ]
        }
    ];
    state = new Fire.AnimationState(clip);
    initClipData(entity, state);
    var posCurve = state.curves[0];
    var scaleCurveX = state.curves[1];
    var scaleCurveY = state.curves[2];
    var colorCurve = state.curves[3];
    strictEqual(state.curves.length, 4, 'should create 3 curve');
    strictEqual(posCurve.target, entity.transform, 'target of posCurve should be transform');
    strictEqual(posCurve.prop, 'position', 'propName of posCurve should be position');
    strictEqual(scaleCurveX.target, entity.transform, 'target of scaleCurve should be transform');
    strictEqual(scaleCurveX.prop, 'scale', 'propName of scaleCurve should be scale');
    strictEqual(colorCurve.target, renderer, 'target of colorCurve should be sprite renderer');
    strictEqual(colorCurve.prop, 'color', 'propName of colorCurve should be color');

    deepEqual(posCurve.values, [v2(50, 100), v2(100, 75), v2(100, 50)], 'values of posCurve should equals keyFrames');

    deepEqual(scaleCurveY.values, [10, 12, 20], 'values of scaleCurve should equals keyFrames');

    deepEqual(colorCurve.values, [1, 0], 'values of colorCurve should equals keyFrames');

    deepEqual(posCurve.ratios, [0, 0.5, 1], 'ratios of posCurve should equals keyFrames');
    deepEqual(colorCurve.ratios, [0, 1], 'ratios of colorCurve should equals keyFrames');
});
