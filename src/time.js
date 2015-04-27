/**
 * !#en The interface to get time information from Fireball.
 *
 * See [Time](/en/scripting/time/)
 * !#zh Time 模块用于获得游戏里的时间和帧率相关信息。直接使用 Fire.Time.*** 访问即可。
 *
 * 请参考教程[计时和帧率](/zh/scripting/time/)
 *
 * @class Time
 * @static
 */
var Time = (function () {
    var Time = {};

    /**
     * The time at the beginning of this frame. This is the time in seconds since the start of the game.
     * @property time
     * @type {number}
     * @readOnly
     */
    Time.time = 0;

    /**
     * The time at the beginning of this frame. This is the real time in seconds since the start of the game.
     *
     * `Time.realTime` not affected by time scale, and also keeps increasing while the player is paused in editor or in the background.
     * @property realTime
     * @type {number}
     * @readOnly
     */
    Time.realTime = 0;

    /**
     * The time in seconds it took to complete the last frame. Use this property to make your game frame rate independent.
     * @property deltaTime
     * @type {number}
     * @readOnly
     */
    Time.deltaTime = 0;

    /**
     * The total number of frames that have passed.
     * @property frameCount
     * @type {number}
     * @readOnly
     */
    Time.frameCount = 0;

    /**
     * The maximum time a frame can take.
     * @property maxDeltaTime
     * @type {number}
     * @readOnly
     */
    Time.maxDeltaTime = 0.3333333;

    var lastUpdateTime = 0;
    var startTime = 0;

    /**
     * @method Fire.Time._update
     * @param {number} timestamp
     * @param {boolean} [paused=false] if true, only realTime will be updated
     * @param {number} [maxDeltaTime=Time.maxDeltaTime]
     * @private
     */
    Time._update = function (timestamp, paused, maxDeltaTime) {
        if (!paused) {
            maxDeltaTime = maxDeltaTime || Time.maxDeltaTime;
            var delta = timestamp - lastUpdateTime;
            delta = Math.min(maxDeltaTime, delta);
            lastUpdateTime = timestamp;

            ++Time.frameCount;
            Time.deltaTime = delta;
            Time.time += delta;
        }
        Time.realTime = timestamp - startTime;
    };

    Time._restart = function (timestamp) {
        Time.time = 0;
        Time.realTime = 0;
        Time.deltaTime = 0;
        Time.frameCount = 0;
        lastUpdateTime = timestamp;
        startTime = timestamp;
    };

    return Time;
})();

Fire.Time = Time;
