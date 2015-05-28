/**
 * Animate play direction
 * @enum PlaybackDirection
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
 * The abstract interface for all playing animation.
 * @class AnimationNodeBase
 * @constructor
 * @extends Playable
 */
var AnimationNodeBase = function () {
    Playable.call(this);
};
JS.extend(AnimationNodeBase, Playable);

/**
 * @method update
 * @param deltaTime
 * @private
 */
AnimationNodeBase.prototype.update = function (deltaTime) {};


/**
 * The collection and instance of playing animations created by entity.animate.
 * @class AnimationNode
 * @constructor
 * @extends AnimationNodeBase
 * @param {Animator} animator
 * @param {AnimCurve[]} [curves]
 * @param {object} [timingInput] - This dictionary is used as a convenience for specifying the timing properties of an Animation in bulk.
 */
var AnimationNode = Fire.Class({
    name: 'Fire.AnimationNode',
    extends: AnimationNodeBase,

    constructor: function () {

        // parse arguments

        this.animator = arguments[0];
        var curves = arguments[1];
        var timingInput = arguments[2];

        if (curves) {
            this.curves = curves;
        }
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
            // 兼容旧的命名
            if ('direction' in timingInput) {
                timingInput.wrapMode = timingInput.direction;
                Fire.warn('[animate] direction is deprecated, use wrapMode instead please.');
            }
            //
            var wrapMode = timingInput.wrapMode;
            if (typeof wrapMode !== 'undefined') {
                if (typeof wrapMode === 'number') {
                    this.wrapMode = wrapMode;
                }
                else {
                    this.wrapMode = Fire.PlaybackDirection[wrapMode];
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
         * !#en Wrapping mode of the playing animation.
         * !#zh 动画循环方式
         * @property wrapMode
         * @type {PlaybackDirection}
         * @default: Fire.PlaybackDirection.normal
         */
        wrapMode: PlaybackDirection.normal
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

        // sample

        if (this.sample()) {
            this.stop();
        }
    },

    _calculateDirectedTime: function (iterationTime, currentIterations) {
        var duration = this.duration;
        var wrapMode = this.wrapMode;
        if (wrapMode === PlaybackDirection.alternate) {
            var isOddIteration = currentIterations & 1;
            if (isOddIteration) {
                return duration - iterationTime;
            }
            else {
                return iterationTime;
            }
        }
        else if (wrapMode === PlaybackDirection.reverse) {
            return duration - iterationTime;
        }
        else if (wrapMode === PlaybackDirection['alternate-reverse']) {
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

    sample: function () {

        // calculate times

        var stopped = false;
        var duration = this.duration;
        var ratio = 0;         // computed ratio
        var time = this.time;   // computed time
        var currentIterations = time / duration;
        if (currentIterations < this.iterations) {
            // calculate iteration time
            if (time > duration) {
                time %= duration;
            }
            // calculate directed time
            if (this.wrapMode !== PlaybackDirection.normal) {
                time = this._calculateDirectedTime(time, currentIterations);
            }
            ratio = time / duration;
        }
        else {
            stopped = true;
            ratio = this.iterations - (this.iterations | 0);
            if (currentIterations > 0 && ratio === 0) {
                ratio = 1; // 如果播放过，动画不复位
            }
            time = ratio * duration;
        }

        // sample

        var curves = this.curves;
        var animator = this.animator;
        for (var i = 0, len = curves.length; i < len; i++) {
            var curve = curves[i];
            curve.sample(time, ratio, animator);
        }

        return stopped;
    }

    //onPlay: function () {
    //},
    //
    //onStop: function () {
    //}
});

Fire.AnimationNode = AnimationNode;
