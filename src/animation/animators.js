// The base of animators
var Animator = (function () {
    function Animator (target) {
        this.target = target;
        // {AnimationNodeBase}
        this.playingAnims = [];
    }

    JS.extend(Animator, Playable);

    var prototype = Animator.prototype;

    // 由 AnimationManager 调用，只有在该 animator 处于播放状态时才会被调用
    prototype.update = function (deltaTime) {
        var anims = this.playingAnims;
        for (var i = 0; i < anims.length; i++) {
            var anim = anims[i];
            if (anim._isPlaying) {
                anim.update(deltaTime);
                // if removed
                if (! anim._isPlaying) {
                    anims.splice(i, 1);     // TODO: 由 anim 来负责调用 splice
                    i--;
                }
            }
        }
        if (anims.length === 0) {
            this.stop();
        }
    };

    prototype.onPlay = function () {
        // @ifdef EDITOR
        if (Engine._isPlaying) {
            Engine._animationManager.addAnimator(this);
        }
        // @endif
        // @ifndef EDITOR
        Engine._animationManager.addAnimator(this);
        // @endif
    };

    prototype.onStop = function () {
        this.playingAnims.length = 0;
        // @ifdef EDITOR
        if (Engine._isPlaying) {
            Engine._animationManager.removeAnimator(this);
        }
        // @endif
        // @ifndef EDITOR
        Engine._animationManager.removeAnimator(this);
        // @endif
    };

    return Animator;
})();

// The actual animator for Entity
var EntityAnimator = (function () {

    function EntityAnimator (target) {
        Animator.call(this, target);
    }
    JS.extend(EntityAnimator, Animator);

    var prototype = EntityAnimator.prototype;

    // 通用逻辑

    function computeNullRatios (keyFrames) {
        var lastIndex = 0;
        var lastRatio = 0;

        var len = keyFrames.length;
        for (var i = 0; i < len; i++) {
            var frame = keyFrames[i];
            // 兼容旧的命名
            if ('offset' in frame) {
                Fire.warn('[animate] offset is deprecated, use ratio instead please.');
                frame.ratio = frame.offset;
            }
            //
            var ratio = frame.ratio;
            if (i === 0 && typeof ratio !== "number") {
                // 如果一开始就没有 ratio，则默认从 0 开始
                frame.computedRatio = ratio = 0;
            }
            else if (i === len - 1 && typeof ratio !== "number") {
                // 如果最后没有 ratio，则设置为 1
                frame.computedRatio = ratio = 1;
            }
            if (typeof ratio === "number") {
                if (lastIndex + 1 < i) {
                    var count = i - lastIndex;
                    var step = (ratio - lastRatio) / count;
                    for (var j = lastIndex + 1; j < i; j++) {
                        lastRatio += step;
                        keyFrames[j].computedRatio = lastRatio;   // 不占用已有变量，这样 keyFrames 才能重用
                    }
                }
                lastIndex = i;
                lastRatio = ratio;
            }
        }
    }

// @ifdef DEV
    __TESTONLY__.computeNullRatios = computeNullRatios;
// @endif

    ///**
    // * @param {object[]} keyFrames
    // * @param {object} [timingInput] - This dictionary is used as a convenience for specifying the timing properties of an Animation in bulk.
    // * @return {AnimationNode}
    // */
    prototype.animate = function (keyFrames, timingInput) {
        if (! keyFrames) {
            Fire.error('[animate] keyFrames must be non-nil');
            return null;
        }
        // compute absolute ratio of each keyframe with a null ratio
        computeNullRatios(keyFrames);

        var anim = this._doAnimate(keyFrames, timingInput);

        this.play();
        return anim;
    };

    // 具体逻辑

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
        var lastRatio = -1;
        for (var i = 0; i < keyFrames.length; i++) {
            var frame = keyFrames[i];

            // get ratio
            var ratio = frame.ratio;
            if (typeof ratio !== "number") {
                ratio = frame.computedRatio;
            }
            if (ratio < 0) {
                Fire.error('[animate] ratio should >= 0!');
                continue;
            }
            if (ratio < lastRatio) {
                Fire.error('[animate] ratio should in the order of smallest to largest!');
                continue;
            }
            lastRatio = ratio;

            // TODO 先遍历每一帧，获得所有曲线

            // parse keyframe
            for (var key in frame) {
                // get component data
                if (key === 'ratio' || key === 'offset') {
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
                    curve.ratios.push(ratio);
                }
            }
        }
        this.playingAnims.push(anim);
        return anim;
    };

    // @ifdef DEV
    __TESTONLY__.EntityAnimator = EntityAnimator;
    // @endif
    return EntityAnimator;
})();

