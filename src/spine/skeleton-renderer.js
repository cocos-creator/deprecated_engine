/**
 * @module Fire.Spine
 */
var SkeletonRenderer = (function () {

    var SpineRuntime = Fire._Runtime.Spine;

    /**
     * @class SkeletonRenderer
     * @extends Renderer
     * @constructor
     */
    var SkeletonRenderer = Fire.Class({
        name: 'Fire.Spine.SkeletonRenderer', extends: Renderer,

        constructor: function () {
            RenderContext.initRenderer(this);
        },

        properties: {

            _skeletonData: null,

            /**
             * @property skeletonData
             * @type {SkeletonDataAsset}
             */
            skeletonData: {
                get: function () {
                    return this._skeletonData;
                },
                set: function (value) {
                    this._skeletonData = value;
                    SpineRuntime.updateSkeletonData(this);
                },
                type: SkeletonDataAsset
            },

            _debugSlots: {
                default: false,
                editorOnly: true
            },

            /**
            * Indicates whether open debug slots.
            * @property debugSlots
            * @type {boolean}
            * @default false
            */
            debugSlots: {
                get: function () {
                    return this._debugSlots;
                },
                set: function (value) {
                    this._debugSlots = value;
                    SpineRuntime.updateSkeletonDebug(this);
                }
            },

            _debugBones: {
                default: false,
                editorOnly: true
            },

            /**
            * Indicates whether open debug bones.
            * @property debugBones
            * @type {boolean}
            * @default false
            */
            debugBones: {
                get: function () {
                    return this._debugBones;
                },
                set: function (value) {
                    this._debugBones = value;
                    SpineRuntime.updateSkeletonDebug(this);
                }
            }
        },


        onLoad: function () {
            SpineRuntime.createSkeleton(this);
        },

        onEnable: function () {
            Engine._renderContext.show(this, true);
        },

        onDisable: function () {
            Engine._renderContext.show(this, false);
        },

        onDestroy: function () {
            Engine._renderContext.remove(this);
        },


        getWorldSize: function () {
            return SpineRuntime.getWorldSize(this);
        },

        getSelfMatrix: function (out) {
            return out.identity();
        },

        /**
         * Sets the bones to the setup pose, using the values from the `BoneData` list in the `SkeletonData`.
         * @method setBonesToSetupPose
         * @beta
         */
        setBonesToSetupPose: function () {
            SpineRuntime.setBonesToSetupPose(this);
        },

        /**
         * Sets the slots to the setup pose, using the values from the `SlotData` list in the `SkeletonData`.
         * @method setSlotsToSetupPose
         * @beta
         */
        setSlotsToSetupPose: function () {
            SpineRuntime.setSlotsToSetupPose(this);
        },

        /**
         * Finds a bone by name. This does a string comparison for every bone.
         * @method findBone
         * @param {string} boneName
         * @return {spine.Bone}
         * @beta
         */
        findBone: function (boneName) {
            return SpineRuntime.findBone(this, boneName);
        },

        /**
         * Finds a slot by name. This does a string comparison for every slot.
         * @method findSlot
         * @param {string} slotName
         * @return {spine.Slot}
         * @beta
         */
        findSlot: function (slotName) {
            return SpineRuntime.findSlot(this, slotName);
        },

        /**
         * Finds a skin by name and makes it the active skin. This does a string comparison for every skin. Note that
         * setting the skin does not change which attachments are visible.
         * @method setSkin
         * @param {string} skinName
         * @return {spine.Skin}
         * @beta
         */
        setSkin: function (skinName) {
            SpineRuntime.setSkin(this, skinName);
        },

        /**
         * Returns the attachment for the slot and attachment name. The skeleton looks first in its skin, then in the
         * skeleton data’s default skin.
         * @method getAttachment
         * @param {string} slotName
         * @param {string} attachmentName
         * @return {spine.RegionAttachment|spine.BoundingBoxAttachment}
         * @beta
         */
        getAttachment: function (slotName, attachmentName) {
            return SpineRuntime.getAttachment(this, slotName, attachmentName);
        },

        /**
         * Sets the attachment for the slot and attachment name. The skeleton looks first in its skin, then in the
         * skeleton data’s default skin.
         * @method setAttachment
         * @param {string} slotName
         * @param {string} attachmentName
         * @beta
         */
        setAttachment: function (slotName, attachmentName) {
            SpineRuntime.setAttachment(this, slotName, attachmentName);
        }
    });

    Fire.executeInEditMode(SkeletonRenderer);

    return SkeletonRenderer;
})();

Fire.Spine.SkeletonRenderer = SkeletonRenderer;
