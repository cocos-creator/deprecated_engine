var Playable = (function () {
    /**
     * @class Playable
     * @constructor
     */
    function Playable () {
        this._isPlaying = false;
        this._isPaused = false;
        this._isUpdating = false;   // to cache the result of _isPlaying && !_isPaused
        this._stepOnce = false;
    }

    //JS.extend(Playable, EventTarget);

    var prototype = Playable.prototype;

    /**
     * Is playing?
     * This property ignores the paused state, so even it is currently paused, this property still true.
     *
     * @property isPlaying
     * @type {boolean}
     * @default false
     * @readOnly
     */
    JS.get(prototype, 'isPlaying', function () {
        return this._isPlaying;
    }, true);

    /**
     * Is currently updating?
     * This property is just the result of (this.isPlaying == true && this.isPaused == false)
     *
     * @property isUpdating
     * @type {boolean}
     * @default false
     * @readOnly
     */
    JS.get(prototype, 'isUpdating', function () {
        return this._isUpdating;
    }, true);

    /**
     * Is currently paused? This can be true even if in edit mode(isPlaying == false).
     * @property isPaused
     * @type {boolean}
     * @default false
     * @readOnly
     */
    JS.get(prototype, 'isPaused', function () {
        return this._isPaused;
    }, true);

    // virtual

    var virtual = function () {};
    /**
     * @method onPlay
     * @private
     */
    prototype.onPlay = virtual;
    /**
     * @method onPause
     * @private
     */
    prototype.onPause = virtual;
    /**
     * @method onResume
     * @private
     */
    prototype.onResume = virtual;
    /**
     * @method onStop
     * @private
     */
    prototype.onStop = virtual;
    /**
     * @method onError
     * @param {string} errorCode
     * @private
     */
    prototype.onError = virtual;

    // public

    /**
     * @method play
     */
    prototype.play = function () {
        if (this._isPlaying) {
            if (this._isPaused) {
                this._isPaused = false;
                this._isUpdating = true;
                this.onResume();
                //this.emit('resume');
            }
            else {
                this.onError('already-playing');
                //this.emit('error', 'already-play');
            }
        }
        else {
            this._isPlaying = true;
            this._isUpdating = !this._isPaused;
            this.onPlay();
            //this.emit('play');
        }
    };

    /**
     * @method stop
     */
    prototype.stop = function () {
        if (this._isPlaying) {
            this._isPlaying = false;
            this._isPaused = false;
            this._isUpdating = false;
            //this.emit('stop');
            this.onStop();
        }
    };

    /**
     * @method pause
     */
    prototype.pause = function () {
        this._isPaused = true;
        this._isUpdating = false;
        //this.emit('pause');
        this.onPause();
    };

    /**
     * Perform a single frame step.
     * @method step
     */
    prototype.step = function () {
        this.pause();
        this._stepOnce = true;
        if (!this._isPlaying) {
            this.play();
        }
    };

    return Playable;
})();
