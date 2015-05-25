
// The actual animator for Animation Component

var AnimationAnimator = (function () {
    function AnimationAnimator (target, animation) {
        Animator.call(this, target);
        this.animation = animation;
    }
    JS.extend(AnimationAnimator, Animator);
    var p = AnimationAnimator.prototype;

    p.playState = function (state) {
        var clip = state.clip;
        if (!clip) {
            return;
        }
        var curves = state.curves;
        if (!state.curveLoaded) {
            initClipData(this.target, state);
        }
        this.playingAnims.push(state);
        state.play();
        this.play();
    };

    p.sample = function () {
        var anims = this.playingAnims;
        for (var i = 0; i < anims.length; i++) {
            var anim = anims[i];
            anim.sample();
        }
    };

    p.stopState = function (state) {
        if (JS.Array.remove(this.playingAnims, state)) {
            state.stop();
        }
    };

    // @ifdef EDITOR
    p.reloadClip = function (state) {
        if (state.isPlaying) {
            initClipData(this.target, state);
        }
        else {
            state.curveLoaded = false;
        }
    };
    // @endif

    function createBatchedProperty (propPath, firstDotIndex, mainValue, animValue) {
        mainValue = mainValue.clone();
        var nextValue = mainValue;
        var leftIndex = firstDotIndex + 1;
        var rightIndex = propPath.indexOf('.', leftIndex);

        // scan property path
        while (rightIndex !== -1) {
            var nextName = propPath.slice(leftIndex, rightIndex);
            nextValue = nextValue[nextName];
            leftIndex = rightIndex + 1;
            rightIndex = propPath.indexOf('.', leftIndex);
        }
        var lastPropName = propPath.slice(leftIndex);
        nextValue[lastPropName] = animValue;

        return mainValue;
    }

    // @ifdef DEV
    __TESTONLY__.createBatchedProperty = createBatchedProperty;
    // @endif

    function initClipData (target, state) {
        var clip = state.clip;
        var curves = state.curves;
        curves.length = 0;
        var length = clip.length;
        var frameCount = length * clip.frameRate;
        if (frameCount === 0) {
            return;
        }
        var frameCountReciprocal = 1 / frameCount;

        // for each properties
        var propDataArray = clip.curveData;
        for (var i = 0, len = propDataArray.length; i < len; i++) {
            var propData = propDataArray[i];

            // get component data
            var comp = target.getComponent(propData.component);
            if (!comp) {
                continue;
            }

            // create curve
            var curve = new DynamicAnimCurve();
            curves.push(curve);
            // 缓存目标对象，所以 Component 必须一开始都创建好并且不能运行时动态替换……
            curve.target = comp;

            var propName, propValue;
            var propPath = propData.property;
            var dotIndex = propPath.indexOf('.');
            var hasSubProp = dotIndex !== -1;
            if (hasSubProp) {
                propName = propPath.slice(0, dotIndex);
                propValue = comp[propName];
                if (!(propValue instanceof ValueType)) {
                    Fire.error('Only support sub animation property which is type ValueType');
                    continue;
                }
            }
            else {
                propName = propPath;
            }

            curve.prop = propName;
            // for each keyframes
            var keyframes = propData.keys;
            for (var j = 0, l = keyframes.length; j < l; j++) {
                var keyframe = keyframes[j];
                var ratio = keyframe.frame * frameCountReciprocal;
                curve.ratios.push(ratio);

                var curveValue = keyframe.value;
                if (hasSubProp) {
                    curveValue = createBatchedProperty(propPath, dotIndex, propValue, curveValue);
                }
                curve.values.push(curveValue);
            }
        }
    }

    // @ifdef DEV
    __TESTONLY__.initClipData = initClipData;
    // @endif

    return AnimationAnimator;
})();
