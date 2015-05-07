/**
 * @module Fire.Spine
 */
/**
 * @class SkeletonDataAsset
 * @extends CustomAsset
 * @constructor
 */
var SkeletonDataAsset = Fire.Class({ name: 'Fire.Spine.SkeletonDataAsset', extends: Fire.CustomAsset,

    constructor: function () {
        this.skeletonData = null;
    },

    properties: {

        /**
         * @property atlasAsset
         * @type {AtlasAsset}
         */
        atlasAsset: {
            default: null,
            type: AtlasAsset
        },

        /**
         * @property skeletonJson
         * @type {JsonAsset}
         */
        skeletonJson: {
            default: null,
            type: Fire.JsonAsset
        },

        /**
         * Scale can be specified on the JSON or binary loader which will scale the bone positions, image sizes, and animation translations.
         * @property scale
         * @type {number}
         */
        scale: 1
    },

    /**
     * @method getSkeletonData
     * @param {boolean} [quiet=false]
     * @return {spine.SkeletonData}
     */
    getSkeletonData: function (quiet) {
        if (! this.atlasAsset) {
            if (! quiet) {
                Fire.error('Atlas not set for SkeletonData asset: ' + this.name);
            }
            return null;
        }

        if (! this.skeletonJson) {
            if (! quiet) {
                Fire.error('Skeleton JSON file not set for SkeletonData asset: ' + this.name);
            }
            return null;
        }

        //scale = 1 / cc.director.getContentScaleFactor();

        var atlas = this.atlasAsset.getAtlas();
        var attachmentLoader = new spine.AtlasAttachmentLoader(atlas);
        var skeletonJsonReader = new spine.SkeletonJson(attachmentLoader);
        skeletonJsonReader.scale = this.scale;

        var json = this.skeletonJson.json;
        var skeletonData = skeletonJsonReader.readSkeletonData(json);
        atlas.dispose(skeletonJsonReader);

        return skeletonData;
    }
});

Fire.Spine.SkeletonDataAsset = SkeletonDataAsset;
