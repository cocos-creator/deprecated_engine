/**
 * @module Fire.Spine
 */
var Skeleton = (function () {

    var SpineRuntime = Fire._Runtime.Spine;

    /**
     * The skeleton animation of spine.
     * @class Skeleton
     * @extends SkeletonRenderer
     * @constructor
     */
    var Skeleton = Fire.Class({
        name: 'Fire.Spine.Skeleton', extends: SkeletonRenderer,

        constructor: function () {
            this._defaultAnimPlayed = false;
            // @ifdef EDITOR
            this._bindedAnimChanged = this._onAnimChanged.bind(this);
            // @endif
        },

        // @ifdef EDITOR
        _onAnimChanged: function () {
            if (this._observing) {
                Object.getNotifier(this).notify({
                    type: 'update',
                    name: '_animationIndex',
                    oldValue: this._animationIndex
                });
            }
        },
        // @endif

        properties: {
            /**
             * The default animation name.
             * @property defaultAnimation
             * @type {string}
             */
            defaultAnimation: {
                default: '',
                visible: false
            },

            /**
             * The current playing animation.
             * @property animationName
             * @type {string}
             */
            currentAnimation: {
                get: function () {
                    var entry = this.getCurrent(0);
                    return (entry && entry.animation.name) || "";
                },
                set: function (value) {
                    this.defaultAnimation = value;
                    if (value) {
                        this.setAnimation(0, value, this.loop);
                    }
                    else {
                        this.clearTrack(0);
                        this.setToSetupPose();
                    }
                },
                visible: false
            },

            _animationIndex: {
                get: function () {
                    var animationName;

                    // @ifdef EDITOR
                    if (Engine.isPlaying) {
                        animationName = this.currentAnimation;
                    }
                    else {
                        animationName = this.defaultAnimation;
                    }
                    // @endif
                    // @ifndef EDITOR
                    animationName = this.currentAnimation;
                    // @endif

                    if (this._skeletonData && animationName) {
                        var animsEnum = this._skeletonData.getAnimsEnum();
                        if (animsEnum) {
                            var animIndex = animsEnum[animationName];
                            if (typeof animIndex !== "undefined") {
                                return animIndex;
                            }
                        }
                    }
                    return 0;
                },
                set: function (value) {
                    if (this._skeletonData) {
                        if (value === 0) {
                            this.currentAnimation = '';
                            return;
                        }
                        var animsEnum = this._skeletonData.getAnimsEnum();
                        if (animsEnum) {
                            var animName = animsEnum[value];
                            if (typeof animName !== "undefined") {
                                this.currentAnimation = animName;
                            }
                            else {
                                Fire.error('Cannot set _animationIndex of "%s" because the index is out of range.',
                                    this.entity.name);
                            }
                        }
                        else {
                            Fire.error('Cannot set _animationIndex of "%s" because there is not any animation in skeletonData.',
                                this.entity.name);
                        }
                    }
                    else if (value > 0) {
                        Fire.error('Cannot set _animationIndex of "%s" because skeletonData is invalid.',
                            this.entity.name);
                    }
                },
                type: Spine._DefaultAnimsEnum,
                visible: true,
                displayName: 'Animation'
            },

            /**
             * @property loop
             * @type {boolean}
             * @default false
             */
            loop: false,

            _timeScale: 1,

            /**
             * The time scale of this skeleton.
             * @property timeScale
             * @type {number}
             * @default 1
             */
            timeScale: {
                get: function () {
                    return this._timeScale;
                },
                set: function (value) {
                    this._timeScale = value;
                    SpineRuntime.updateSkeletonTimeScale(this);
                }
            }
        },

        onLoad: function () {
            SkeletonRenderer.prototype.onLoad.call(this);
            // @ifdef EDITOR
            this.entity.on('animation-end', this._bindedAnimChanged);
            // @endif
        },
        onEnable: function () {
            SkeletonRenderer.prototype.onEnable.call(this);
            if (!this._defaultAnimPlayed) {
                this.currentAnimation = this.defaultAnimation;
            }
        },
        // @ifdef EDITOR
        onDestroy: function () {
            SkeletonRenderer.prototype.onDestroy.call(this);
            this.entity.off('animation-end', this._bindedAnimChanged);
        },
        // @endif

        /**
         * Mix applies all keyframe values, interpolated for the specified time and mixed with the current values.
         * @method setMix
         * @param {string} fromAnimation
         * @param {string} toAnimation
         * @param {number} duration
         * @beta
         */
        setMix: function (fromAnimation, toAnimation, duration) {
            SpineRuntime.setMix(this, fromAnimation, toAnimation, duration);
        },

        /**
         * Set the current animation. Any queued animations are cleared.
         * @method setAnimation
         * @param {number} trackIndex
         * @param {string} name
         * @param {boolean} loop
         * @return {spine.TrackEntry|null}
         * @beta
         */
        setAnimation: function (trackIndex, name, loop) {
            SpineRuntime.setAnimation(this, trackIndex, name, loop);
            // @ifdef EDITOR
            if (!Engine.isPlaying) {
                SpineRuntime.sampleAnimation(this);
                this.clearTrack(trackIndex);
            }
            // @endif
        },

        /**
         * Adds an animation to be played delay seconds after the current or last queued animation.
         * @method addAnimation
         * @param {number} trackIndex
         * @param {string} name
         * @param {boolean} loop
         * @param {number} delay
         * @return {spine.TrackEntry|null}
         * @beta
         */
        addAnimation: function (trackIndex, name, loop, delay) {
            return SpineRuntime.addAnimation(this, trackIndex, name, loop, delay);
        },

        /**
         * Returns track entry by trackIndex.
         * @method getCurrent
         * @param trackIndex
         * @return {spine.TrackEntry|null}
         * @beta
         */
        getCurrent: function (trackIndex) {
            return SpineRuntime.getCurrent(this, trackIndex);
        },

        /**
         * Clears all tracks of animation state.
         * @method clearTracks
         * @beta
         */
        clearTracks: function () {
            SpineRuntime.clearTracks(this);
        },

        /**
         * Clears track of animation state by trackIndex.
         * @method clearTrack
         * @param {number} trackIndex
         * @beta
         */
        clearTrack: function (trackIndex) {
            SpineRuntime.clearTrack(this, trackIndex);
            // @ifdef EDITOR
            if (!Engine.isPlaying) {
                SpineRuntime.sampleAnimation(this);
            }
            // @endif
        },

        // @ifdef EDITOR
        _updateEnums: function (skeletonData) {
            SkeletonRenderer.prototype._updateEnums.call(this, skeletonData);
            var animsEnum;
            if (skeletonData) {
                animsEnum = skeletonData.getAnimsEnum();
            }
            // change enum
            Fire.attr(this, '_animationIndex', Fire.Enum(animsEnum || Spine._DefaultAnimsEnum));
        }
        // @endif
    });

    Fire.addComponentMenu(Skeleton, 'Spine Skeleton');

    return Skeleton;
})();

Spine.Skeleton = Skeleton;
