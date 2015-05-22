

var AnimationState = (function () {

    // AnimationState 是特殊的 AnimationNode，将来应该和 AnimationNode 合并。

    /**
     * The AnimationState gives full control over animation playback process.
     * In most cases the Animation Component is sufficient and easier to use. Use the AnimationState if you need full control.
     *
     * @class AnimationState
     * @extends AnimationNodeBase
     * @constructor
     * @param {AnimationClip} clip
     * @param {string} [name]
     */
    function AnimationState (clip, name) {
        this._name = name || clip.name;
        this._clip = clip;

        ///**
        // * Wrapping mode of the playing animation.
        // * @property wrapMode
        // * @type {WrapMode}
        // */
        //this.wrapMode = 0;

        ///**
        // * The playback speed of the animation. 1 is normal playback speed.
        // * @property speed
        // * @type {number}
        // * @default 1.0
        // */
        //this.playbackRate = 1;

        // the current time of the playing animation in seconds
        //this.time = 0;


        this._animNode = new AnimationNode(null, null, {
            iterations: 1,
            duration: this.length
            //wrapMode:
        });
    }
    JS.extend(AnimationState, AnimationNodeBase);

    var p = AnimationState.prototype;

    /**
     * The clip that is being played by this animation state.
     * @property clip
     * @type {AnimationClip}
     * @readOnly
     */
    JS.get(p, 'clip', function () {
        return this._clip;
    });

    /**
     * The name of the playing animation.
     * @property name
     * @type {string}
     * @readOnly
     */
    JS.get(p, 'name', function () {
        return this._name;
    });

    /**
     * The length of the sprite animation in seconds with speed = 1.0f
     * @property length
     * @type {number}
     * @readOnly
     */
    JS.get(p, 'length', function () {
        return this._clip.length;
        //var curveDataArray = this._clip.frames;
        //if (curveDataArray.length > 0) {
        //    var curveData = curveDataArray[0];
        //    var keys = curveData.keys;
        //    if (keys.length > 0) {
        //        return keys[keys.length - 1].frame / this._clip.frameRate;
        //    }
        //}
        //return 0;
    });

    JS.getset(p, 'playbackRate',
        function () {
            return this._animNode.playbackRate;
        },
        function (value) {
            this._animNode.playbackRate = value;
        }
    );

    JS.getset(p, 'time',
        function () {
            return this._animNode.time;
        },
        function (value) {
            this._animNode.time = value;
        }
    );

    var SpeedWarning = '[AnimationState] Use playbackRate instead of speed please.';
    JS.getset(p, 'speed',
        function () {
            Fire.warn(SpeedWarning);
            return this.playbackRate;
        },
        function (value) {
            Fire.warn(SpeedWarning);
            this.playbackRate = value;
        }
    );

    JS.getset(p, 'curves',
        function () {
            return this._animNode.curves;
        },
        function (value) {
            this._animNode.curves = value;
        }
    );

    p.sample = function () {
        this._animNode.sample();
    };

    return AnimationState;
})();

Fire.AnimationState = AnimationState;
