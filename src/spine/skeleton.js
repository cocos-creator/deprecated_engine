/**
 * @module Fire.Spine
 */
var Skeleton = (function () {

    var SpineRuntime = Fire._Runtime.Spine;

    /**
     * @class Skeleton
     * @extends SkeletonRenderer
     * @constructor
     */
    var Skeleton = Fire.Class({
        name: 'Fire.Spine.Skeleton', extends: SkeletonRenderer,

        constructor: function () {
        },

        properties: {
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


        //onLoad: function () {
        //    SpineRuntime.createSkeleton(this);
        //},
        //
        //onEnable: function () {
        //    Engine._renderContext.show(this, true);
        //},
        //
        //onDisable: function () {
        //    Engine._renderContext.show(this, false);
        //},
        //
        //onDestroy: function () {
        //    Engine._renderContext.remove(this);
        //},

    });

    Fire.addComponentMenu(Skeleton, 'Spine Skeleton');

    return Skeleton;
})();

Fire.Spine.Skeleton = Skeleton;
