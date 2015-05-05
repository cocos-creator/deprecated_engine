/**
 * 动画数据类，相当于 AnimationClip。
 * 虽然叫做 AnimCurve，但除了曲线，可以保存任何类型的值。
 *
 * @class AnimCurve
 * @constructor
 */
var AnimCurve = Fire.Class({
    name: 'Fire.AnimCurve',

    /**
     * @method sample
     * @param {number} time
     * @param {number} offset - The normalized time specified as a number between 0.0 and 1.0 inclusive.
     * @param {Animator} animator
     */
    sample: function (time, offset, animator) {}
});

/**
 * 区别于 SampledAnimCurve。
 *
 * @class DynamicAnimCurve
 * @constructor
 * @extends AnimCurve
 */
var DynamicAnimCurve = Fire.Class({
    name: 'Fire.DynamicAnimCurve',
    properties: {
        /**
         * The object being animated.
         * @property target
         * @type {object}
         */
        target: null,
        /**
         * The name of the property being animated.
         * @property prop
         * @type {string}
         */
        prop: "",
        /**
         * The values of the keyframes. (y)
         * @property values
         * @type {any[]}
         */
        values: [],
        /**
         * The keyframe offset of the keyframe specified as a number between 0.0 and 1.0 inclusive. (x)
         * @property offsets
         * @type {number[]}
         */
        offsets: []

        // TODO inTan, outTan
    },

    sample: function (time, offset, animator) {
        var values = this.values;
        var offsets = this.offsets;
        var frameCount = offsets.length;
        if (frameCount === 0) {
            return;
        }
        var value;
        var index = Fire.binarySearch(offsets, offset);
        if (index < 0) {
            index = ~index;
            if (index < 0) {
                value = values[0];
            }
            else if (index >= frameCount) {
                value = values[frameCount - 1];
            }
            else {
                var fromOffset = offsets[index - 1];
                var toOffset = offsets[index];
                var ratio = (offset - fromOffset) / (toOffset - fromOffset);
                var fromVal = values[index - 1];
                var toVal = values[index];
                // try linear lerp
                if (typeof fromVal === 'number') {
                    value = fromVal + (toVal - fromVal) * ratio;
                }
                else {
                    var lerp = fromVal.lerp;
                    if (lerp) {
                        value = fromVal.lerp(toVal, ratio);
                    }
                    else {
                        // no linear lerp function, just return last frame
                        value = fromVal;
                    }
                }
            }
        }
        else {
            value = values[index];
        }
        this.target[this.prop] = value;
    }
});

/**
 * @class PlaybackDirection
 * @static
 */
var PlaybackDirection = Fire.defineEnum({

    /**
     * All iterations are played as specified.
     * @property normal
     * @type {number}
     */
    normal: -1,
    /**
     * All iterations are played in the reverse direction from the way they are specified.
     * @property reverse
     * @type {number}
     */
    reverse: -1,

    /**
     * Even iterations are played as specified, odd iterations are played in the reverse direction from the way they
     * are specified. (PingPong)
     * @property alternate
     * @type {number}
     */
    alternate: -1,

    /**
     * Even iterations are played in the reverse direction from the way they are specified, odd iterations are played
     * as specified.
     * @property alternate-reverse
     * @type {number}
     */
    'alternate-reverse': -1
});

Fire.PlaybackDirection = PlaybackDirection;

/**
 * The collection and instance of AnimClips.
 * @class AnimationNode
 * @constructor
 * @param {Animator} animator
 * @param {AnimCurve[]} [curves]
 * @param {object} [timingInput] - This dictionary is used as a convenience for specifying the timing properties of an
 *                                 Animation in bulk.
 */
var AnimationNode = Fire.Class({
    name: 'Fire.AnimationNode',

    extends: Playable,

    constructor: function () {

        // parse arguments

        this.animator = arguments[0];
        var curves = arguments[1];
        var timingInput = arguments[2];

        this.curves = curves || this.curves;
        if (timingInput) {
            this.delay = timingInput.delay || this.delay;
            var iterations = timingInput.iterations;
            if (typeof iterations !== 'undefined') {
                this.iterations = iterations;
            }
            var duration = timingInput.duration;
            if (typeof duration !== 'undefined') {
                this.duration = duration;
            }
            var playbackRate = timingInput.playbackRate;
            if (typeof playbackRate !== 'undefined') {
                this.playbackRate = playbackRate;
            }
            var direction = timingInput.direction;
            if (typeof direction !== 'undefined') {
                if (typeof direction === 'number') {
                    this.direction = direction;
                }
                else {
                    this.direction = Fire.PlaybackDirection[direction];
                }
            }
        }

        // member variables

        /**
         * The active time of this animation, not include delay.
         * @property time
         * @type {number}
         * @default 0
         * @readOnly
         */
        this.time = 0;

        /**
         * The local time, just used for delay
         * @property _timeNoScale
         * @type {number}
         * @default 0
         * @readOnly
         * @private
         */
        this._timeNoScale = 0;

        this._firstFramePlayed = false;

        ///**
        // * The current iteration index beginning with zero for the first iteration.
        // * @property currentIterations
        // * @type {number}
        // * @default 0
        // * @readOnly
        // */
        //this.currentIterations = 0.0;

        // play

        if (this.delay > 0) {
            this.pause();
        }
        this.play();
    },

    properties: {
        /**
         * @property curves
         * @type {AnimCurve[]}
         */
        curves: [],

        // http://www.w3.org/TR/web-animations/#idl-def-AnimationTiming

        /**
         * !#en The start delay which represents the number of seconds from an animation's start time to the start of
         * the active interval.
         * !#zh 延迟多少秒播放
         *
         * @property delay
         * @type {number}
         * @default 0
         */
        delay: 0,

        /**
         * !#en The animation's iteration count property.
         *
         * A real number greater than or equal to zero (including positive infinity) representing the number of times
         * to repeat the animation node.
         *
         * Values less than zero and NaN values are treated as the value 1.0 for the purpose of timing model
         * calculations.
         *
         * !#zh 迭代次数, 指动画播放多少次后结束, normalize time. 如 2.5 ( 2次半 )
         *
         * @property iterations
         * @type {number}
         * @default 1
         */
        iterations: 1,

        /**
         * !#en The iteration duration of this animation in seconds. (length)
         * !#zh 单次动画的持续时间, 秒
         *
         * @property duration
         * @type {number}
         */
        duration: 1,

        /**
         * !#en The animation's playback rate property. (speed)
         * !#zh 播放速率
         * @property playbackRate
         * @type {number}
         * @default: 1.0
         */
        playbackRate: 1,

        /**
         * The playback direction of the animation as specified by one of the PlaybackDirection enumeration values.
         * @property direction
         * @type {PlaybackDirection}
         * @default: Fire.PlaybackDirection.normal
         */
        direction: PlaybackDirection.normal
    },

    update: function (delta) {

        // calculate delay time

        if (this._isPaused) {
            this._timeNoScale += delta;
            if (this._timeNoScale < this.delay) {
                // still waiting
                return;
            }
            else {
                // play
                this.play();
            }
            //// start play
            // delta -= (this._timeNoScale - this.delay);
        }

        // make first frame perfect

        //var playPerfectFirstFrame = (this.time === 0);
        if (this._firstFramePlayed) {
            this.time += (delta * this.playbackRate);
        }
        else {
            this._firstFramePlayed = true;
        }

        // calculate times

        var duration = this.duration;

        var stop = false;
        var offset = 0;         // computed offset
        var time = this.time;   // computed time

        var currentIterations = time / duration;
        if (currentIterations < this.iterations) {
            // calculate iteration time
            if (time > duration) {
                time %= duration;
            }
            // calculate directed time
            if (this.direction !== PlaybackDirection.normal) {
                time = this._calculateDirectedTime(time, currentIterations);
            }
            offset = time / duration;
        }
        else {
            stop = true;
            offset = this.iterations - (this.iterations | 0);
            if (currentIterations > 0 && offset === 0) {
                offset = 1; // 如果播放过，动画不复位
            }
            time = offset * duration;
        }

        // sample animation

        var curves = this.curves;
        var animator = this.animator;
        for (var i = 0, len = curves.length; i < len; i++) {
            var curve = curves[i];
            curve.sample(time, offset, animator);
        }

        if (stop) {
            this.stop();
        }
    },

    _calculateDirectedTime: function (iterationTime, currentIterations) {
        var duration = this.duration;
        var direction = this.direction;
        if (direction === PlaybackDirection.alternate) {
            var isOddIteration = currentIterations & 1;
            if (isOddIteration) {
                return duration - iterationTime;
            }
            else {
                return iterationTime;
            }
        }
        else if (direction === PlaybackDirection.reverse) {
            return duration - iterationTime;
        }
        else if (direction === PlaybackDirection['alternate-reverse']) {
            if (currentIterations & 1) {
                return iterationTime;
            }
            else {
                return duration - iterationTime;
            }
        }
        else {
            return iterationTime;
        }
    },

    //onPlay: function () {
    //},
    //
    //onStop: function () {
    //}
});

Fire.AnimationNode = AnimationNode;
