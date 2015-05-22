
// The actual animator for Animation Component

var AnimationAnimator = (function () {
    function AnimationAnimator (target, animation) {
        Animator.call(this, target);
        this.animation = animation;
    }
    JS.extend(AnimationAnimator, Animator);
    var p = AnimationAnimator.prototype;

    p.playState = function (state) {

        // create curves (include animations for child entities)

        var clip = state.clip;
        if (!clip) {
            return;
        }
        var curves = state.curves;
        var length = clip.length;
        var frameCount = length * clip.frameRate;
        if (frameCount === 0) {
            return;
        }

        // for each properties
        var propDataArray = clip.curveData;
        for (var i = 0, len = propDataArray.length; i < len; i++) {
            var propData = propDataArray[i];

            // get component data
            var comp = this.target.getComponent(propData.component);
            if (! comp) {
                continue;
            }

            var curve = new DynamicAnimCurve();
            curves.push(curve);
            // 缓存目标对象，所以 Component 必须一开始都创建好并且不能运行时动态替换……
            curve.target = comp;
            curve.prop = propData.property;

            // for each keyframes
            var keyframes = propData.keys;
            for (var j = 0, l = keyframes.length; j < l; j++) {
                var keyframe = keyframes[j];
                var ratio = keyframe.frame / frameCount;
                curve.ratios.push(ratio);
                curve.values.push(keyframes.value);
            }
        }
        this.playingAnims.push(state);
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

    return AnimationAnimator;
})();
