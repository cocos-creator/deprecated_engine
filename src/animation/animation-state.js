

var AnimationState = (function () {

    /**
     * The AnimationState gives full control over animation playback process.
     * In most cases the Animation Component is sufficient and easier to use. Use the AnimationState if you need full control.
     *
     * @class AnimationState
     * @extends AnimationNode
     * @constructor
     * @param {AnimationClip} clip
     * @param {string} [name]
     */
    function AnimationState (clip, name) {
        AnimationNode.call(this, null, null, {
            duration: clip.length
        });

        this._clip = clip;
        this._name = name || clip.name;
    }
    JS.extend(AnimationState, AnimationNode);

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

    JS.obsolete(state, 'AnimationState.length', 'duration');

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

    return AnimationState;
})();

Fire.AnimationState = AnimationState;
