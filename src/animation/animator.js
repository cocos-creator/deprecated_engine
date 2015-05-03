var Animator = (function () {
    function Animator (target) {
        this.target = target;
        this.enabled = true;
        this.playingAnims = [];
        // @ifdef EDITOR
        if (Engine._isPlaying) {
            Engine._animationManager.addAnimator(this);
        }
        // @endif
        // @ifndef EDITOR
        Engine._animationManager.addAnimator(this);
        // @endif
        this.play();
    }

    JS.extend(Animator, Playable);

    var prototype = Animator.prototype;

    function computeNullOffsets (keyFrames) {
        var lastIndex = 0;
        var lastOffset = 0;

        var len = keyFrames.length;
        for (var i = 0; i < len; i++) {
            var frame = keyFrames[i];
            var offset = frame.offset;
            if (i === 0 && typeof offset !== "number") {
                // 如果一开始就没有 offset，则默认从 0 开始
                frame.computedOffset = offset = 0;
            }
            else if (i === len - 1 && typeof offset !== "number") {
                // 如果最后没有 offset，则设置为 1
                frame.computedOffset = offset = 1;
            }
            if (typeof offset === "number") {
                if (lastIndex + 1 < i) {
                    var count = i - lastIndex;
                    var step = (offset - lastOffset) / count;
                    for (var j = lastIndex + 1; j < i; j++) {
                        lastOffset += step;
                        keyFrames[j].computedOffset = lastOffset;   // 不占用已有变量，这样 keyFrames 才能重用
                    }
                }
                lastIndex = i;
                lastOffset = offset;
            }
        }
    }

// @ifdef DEV
    __TESTONLY__.computeNullOffsets = computeNullOffsets;
// @endif

    /**
     * @method animate
     * @param {object[]} keyFrames
     * @param {object} [timingInput] - This dictionary is used as a convenience for specifying the timing properties of
     *     an Animation in bulk.
     * @return {Animation}
     */
    prototype.animate = function (keyFrames, timingInput) {
        if (! keyFrames) {
            Fire.error('[animate] keyFrames must be non-nil');
            return;
        }
        // compute absolute offset of each keyframe with a null offset
        computeNullOffsets(keyFrames);

        return this._doAnimate(keyFrames, timingInput);
    };

    // 由 AnimationManager 调用，只有在该 animator 处于播放状态时才会被调用
    prototype.update = function (deltaTime) {
        var anims = this.playingAnims;
        for (var i = 0; i < anims.length; i++) {
            var anim = anims[i];
            if (anim._isPlaying) {
                anim.update(deltaTime);
            }
        }
    };

    prototype.destruct = function () {
        // @ifdef EDITOR
        if (Engine._isPlaying) {
            Engine._animationManager.removeAnimator(this);
        }
        // @endif
        // @ifndef EDITOR
        Engine._animationManager.removeAnimator(this);
        // @endif
    };

    prototype._doAnimate = function () {};

    return Animator;
})();

var EntityAnimator = (function () {

    function EntityAnimator (target) {
        Animator.call(this, target);
    }
    JS.extend(EntityAnimator, Animator);

    var prototype = EntityAnimator.prototype;

    function findCurve (curves, comp, compName, propName) {
        var i = 0, curve;
        if (comp) {
            for (; i < curves.length; i++) {
                curve = curves[i];
                if (curve.target === comp && curve.prop === propName) {
                    return curve;
                }
            }
        }
        else {
            for (; i < curves.length; i++) {
                curve = curves[i];
                var existsCompName = JS.getClassName(curve.target);
                if (compName === existsCompName && curve.prop === propName) {
                    return curve;
                }
            }
        }
        return null;
    }

    prototype._doAnimate = function (keyFrames, timingInput) {
        var anim = new AnimationNode(this, null, timingInput);
        var curves = anim.curves;

        // create curves
        var lastOffset = -1;
        for (var i = 0; i < keyFrames.length; i++) {
            var frame = keyFrames[i];

            // get offset
            var offset = frame.offset;
            if (typeof offset !== "number") {
                offset = frame.computedOffset;
            }
            if (offset < 0) {
                Fire.error('[animate] offset should >= 0!');
                continue;
            }
            if (offset < lastOffset) {
                Fire.error('[animate] offset should in the order of smallest to largest!');
                continue;
            }
            lastOffset = offset;

            // TODO 先遍历每一帧，获得所有曲线

            // parse keyframe
            for (var key in frame) {
                // get component data
                if (key === 'offset') {
                    continue;
                }
                var compName = key;
                var compData = frame[compName];
                var comp = null;
                for (var propName in compData) {
                    // get curve
                    var curve = findCurve(curves, comp, compName, propName);
                    if (! curve) {
                        if (! comp) {
                            comp = this.target.getComponent(compName);
                            if (! comp) {
                                Fire.error('[animate] Component %s is not found!', compName);
                                continue;
                            }
                        }
                        curve = new DynamicAnimCurve();
                        curves.push(curve);
                        // 缓存目标对象，所以 Component 必须一开始都创建好并且不能运行时动态替换……
                        curve.target = comp;
                        curve.prop = propName;
                    }
                    curve.values.push(compData[propName]);
                    curve.offsets.push(offset);
                }
            }
        }
        this.playingAnims.push(anim);
        return anim;
    };

    return EntityAnimator;
})();

// @ifdef DEV
__TESTONLY__.EntityAnimator = EntityAnimator;
// @endif
