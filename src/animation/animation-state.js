

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
        AnimationNodeBase.call(this);

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
        //this.speed = 1;

        // the current time of the playing animation in seconds
        //this.time = 0;


        this._animNode = new AnimationNode(null, null, {
            duration: this.length
            //wrapMode:
        });

        var self = this;
        this._animNode.on('stop', function () {
            self.stop();
        });
        this.on('play', function () {
            self._animNode.play();
        });
    }
    JS.extend(AnimationState, AnimationNodeBase);

    var state = AnimationState.prototype;

    /**
     * The clip that is being played by this animation state.
     * @property clip
     * @type {AnimationClip}
     * @readOnly
     */
    JS.get(state, 'clip', function () {
        return this._clip;
    });

    /**
     * The name of the playing animation.
     * @property name
     * @type {string}
     * @readOnly
     */
    JS.get(state, 'name', function () {
        return this._name;
    });

    /**
     * The length of the sprite animation in seconds with speed = 1.0f
     * @property length
     * @type {number}
     * @readOnly
     */
    JS.get(state, 'length', function () {
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

    JS.getset(state, 'speed',
        function () {
            return this._animNode.speed;
        },
        function (value) {
            this._animNode.speed = value;
        }
    );

    JS.getset(state, 'time',
        function () {
            return this._animNode.time;
        },
        function (value) {
            this._animNode.time = value;
        }
    );

    JS.getset(state, 'curves',
        function () {
            return this._animNode.curves;
        },
        function (value) {
            this._animNode.curves = value;
        }
    );

    JS.getset(state, 'curveLoaded',
        function () {
            return this.curves.length > 0;
        },
        function (value) {
            this.curves.length = 0;
        }
    );

    state.onPlay = function () {
        // replay
        this.time = 0;
    };

    state.update = function (delta) {
        this._animNode.update(delta);
    };
    state.sample = function () {
        this._animNode.sample();
    };

    return AnimationState;
})();

Fire.AnimationState = AnimationState;
