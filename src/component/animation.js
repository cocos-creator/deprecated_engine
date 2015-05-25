
// 这个类主要负责管理 AnimationState 的生命周期

/**
 * @class Animation
 * @extends Component
 * @constructor
 */
var Animation = Fire.Class({
    //
    name: "Fire.Animation",
    extends: Component,
    constructor: function () {
        // The actual implement for Animation
        this._animator = null;

        this._nameToState = {};
        this._didInit = false;

        // @ifdef EDITOR
        this._watchingClipUuids = {};
        this._bindedOnClipChanged = this._onClipChanged.bind(this);
        // @endif
    },

    properties: {
        /**
         * The default animation.
         * @property defaultClip
         * @type {AnimationClip}
         * @default null
         */
        defaultClip: {
            default: null,
            type: Fire.AnimationClip,
            displayName: 'Animation'
        },

        /**
         * The array of animations which available in play() method.
         * @property _clips
         * @type {AnimationClip[]}
         * @default []
         * @private
         */
        _clips: {
            default: [],
            type: [Fire.AnimationClip],
            displayName: 'Animations',
            visible: true
        },

        /**
         * How should time beyond the playback range of the clip be treated?
         * The value should be specified by one of the WrapMode enumeration values.
         */
        wrapMode: {
            default: Fire.PlaybackDirection.normal,
            type: Fire.PlaybackDirection
        },

        /**
         * Should the default animation clip (Animation.defaultClip) automatically play on start.
         * @property playAutomatically
         * @type {boolean}
         * @default true
         */
        playAutomatically: true,

        /**
         * is playing any animations?
         * @property isPlaying
         * @type {boolean}
         * @readOnly
         */
        isPlaying: {
            get: function () {
                return this._animator && this._animator.isPlaying;
            },
            visible: false
        }
    },

    ///////////////////////////////////////////////////////////////////////////////
    // Lifecycle Methods
    ///////////////////////////////////////////////////////////////////////////////

    onLoad: function () {
        this._init();
    },

    start: function () {
        if (/*this.enabled && */this.playAutomatically && this.defaultClip) {
            var state = this.getAnimationState(this.defaultClip.name);
            this._animator.playState(state);
        }
    },

    onDisable: function () {
        this.stop();
    },

    ///////////////////////////////////////////////////////////////////////////////
    // Public Methods
    ///////////////////////////////////////////////////////////////////////////////

    /**
     * Plays an animation.
     * @method play
     * @param {string} [name] - The name of animation to play. If no name is supplied then the default animation will be played.
     * @return {AnimationState} - The AnimationState of playing animation. In cases where the animation can't be played (ie, there is no default animation or no animation with the specified name), the function will return null.
     */
    play: function (name) {
        this._init();
        var state = this.getAnimationState(name || this.defaultClip.name);
        if (state) {
            if (state.isPlaying) {
                this._animator.stopState(state);
            }
            this._animator.playState(state);
            // @ifdef EDITOR
            this._updateWatchingClips(state.clip);
            // @endif
        }
        return state;
    },

    /**
     * Stops an animation named name. If no name is supplied then stops all playing animations that were started with this Animation.
     * Stopping an animation also Rewinds it to the Start.
     * @method stop
     * @param {string} [name] - The animation to stop, if not supplied then stops all playing animations.
     */
    stop: function (name) {
        if (!this._didInit) {
            return;
        }
        if (name) {
            var state = this._nameToState[name];
            if (state) {
                this._animator.stopState(state);
            }
        }
        else {
            this._animator.stop();
        }
    },
    
    /**
     * Returns the animation state named name. If no animation with the specified name, the function will return null.
     * @method getAnimationState
     * @param {string} name
     * @return {AnimationState}
     */
    getAnimationState: function (name) {
        return this._nameToState[name] || null;
    },

    /**
     * Adds a clip to the animation with name newName. If a clip with that name already exists it will be replaced with the new clip.
     * @method addClip
     * @param {AnimationClip} clip - the clip to add
     * @param {string} [newName]
     * @return {AnimationState} - The AnimationState which gives full control over the animation clip.
     */
    addClip: function (clip, newName) {
        if (!clip) {
            Fire.warn('Invalid clip to add');
            return;
        }
        this._init();
        // add clip
        if (!JS.Array.contains(this._clips, clip)) {
            this._clips.push(clip);
        }
        // replace same name clip
        newName = newName || clip.name;
        var oldState = this._nameToState[newName];
        if (oldState) {
            if (oldState.clip === clip) {
                return oldState;
            }
            else {
                JS.Array.remove(this._clips, oldState.clip);
            }
        }
        // replace state
        var newState = new AnimationState(clip, newName);
        this._nameToState[newName] = newState;
        // @ifdef EDITOR
        this._updateWatchingClips();
        // @endif
        return newState;
    },

    _removeStateIfNotUsed: function (state) {
        if (state.clip !== this.defaultClip && ! JS.Array.contains(this._clips, state.clip)) {
            delete this._nameToState[state.name];
        }
    },

    /**
     * Remove clip from the animation list. This will remove the clip and any animation states based on it.
     * @method removeClip
     * @param {AnimationClip} clip
     */
    removeClip: function (clip) {
        if (!clip) {
            Fire.warn('Invalid clip to remove');
            return;
        }
        this._init();
        var state;
        //if (typeof clip === 'string') {
        //    //if (clipOrName === this.defaultClip.name) {
        //    //    // can not remove default clip
        //    //    return;
        //    //}
        //    state = this._nameToState[clip];
        //    if (state) {
        //        this._removeStateIfNotUsed(state);
        //        return;
        //    }
        //}
        //else {
            this._clips = this._clips.filter(function (item) {
                return item !== clip;
            });
            for (var name in this._nameToState) {
                state = this._nameToState[name];
                if (state.clip === clip) {
                    this._removeStateIfNotUsed(state);
                }
            }
        //}
        // @ifdef EDITOR
        this._updateWatchingClips(state.clip);
        // @endif
        Fire.error('Not exists clip to remove');
    },

    /**
     * Samples animations at the current state.
     * This is useful when you explicitly want to set up some animation state, and sample it once.
     * @method sample
     */
    sample: function () {
        this._init();
        this._animator.sample();
    },

    // reload all animation clips
    //_reload: function () {
    //    if (this._didInit) {
    //        //this.stop();
    //        for (var name in this._nameToState) {
    //            var state = this._nameToState[name];
    //            this._animator.reloadClip(state);
    //        }
    //    }
    //},


    ///////////////////////////////////////////////////////////////////////////////
    // Internal Methods
    ///////////////////////////////////////////////////////////////////////////////

    // Dont forget to call _init before every actual process in public methods. (Or checking this.isOnLoadCalled)
    // Just invoking _init by onLoad is not enough because onLoad is called only if the entity is active.

    _init: function () {
        if (this._didInit) {
            return;
        }
        this._didInit = true;
        this._animator = new AnimationAnimator(this.entity, this);
        this._createStates();
        // @ifdef EDITOR
        this._updateWatchingClips();
        // @endif
    },

    _createStates: function() {
        // create animation states
        var state = null;
        var defaultClipState = false;
        for (var i = 0; i < this._clips.length; ++i) {
            var clip = this._clips[i];
            if (clip) {
                state = new AnimationState(clip);
                this._nameToState[state.name] = state;
                if (this.defaultClip === clip) {
                    defaultClipState = state;
                }
            }
        }
        if (this.defaultClip && !defaultClipState) {
            state = new AnimationState(this.defaultClip);
            this._nameToState[state.name] = state;
        }
    },

    // @ifdef EDITOR
    //_watchClip: function (clip) {
    //    var uuid = clip._uuid;
    //    if (uuid in this._watchingClipUuids) {
    //        return;
    //    }
    //    this._watchingClipUuids[uuid] = true;
    //    Fire.AssetLibrary.assetListener.add(uuid, this._bindedOnClipChanged);
    //},
    //_unwatchClip: function (clip) {
    //    var uuid = clip._uuid;
    //    if (uuid in this._watchingClipUuids) {
    //        Fire.AssetLibrary.assetListener.remove(uuid, this._bindedOnClipChanged);
    //        delete this._watchingClipUuids[uuid];
    //    }
    //},
    _updateWatchingClips: function () {
        var uuid;
        for (uuid in this._watchingClipUuids) {
            Fire.AssetLibrary.assetListener.remove(uuid, this._bindedOnClipChanged);
        }
        this._watchingClipUuids = {};

        if (this.defaultClip) {
            uuid = this.defaultClip._uuid;
            this._watchingClipUuids[uuid] = true;
            Fire.AssetLibrary.assetListener.add(uuid, this._bindedOnClipChanged);
        }
        for (var i = 0; i < this._clips.length; i++) {
            var clip = this._clips[i];
            if (clip) {
                uuid = clip._uuid;
                if (!this._watchingClipUuids[uuid]) {
                    this._watchingClipUuids[uuid] = true;
                    Fire.AssetLibrary.assetListener.add(uuid, this._bindedOnClipChanged);
                }
            }
        }
    },
    _onClipChanged: function (clip) {
        var needReSample = false;
        for (var name in this._nameToState) {
            var state = this._nameToState[name];
            if (state.clip === clip) {
                this._animator.reloadClip(state);
                if (state.isPlaying) {
                    needReSample = true;
                }
            }
        }
        if (needReSample) {
            this.sample();
        }
    }
    // @endif
});

Fire.addComponentMenu(Animation, 'Animation');

Fire.Animation = Animation;
