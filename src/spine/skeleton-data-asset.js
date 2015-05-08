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
        this._skeletonData = null;
        // @ifdef EDITOR
        this._skinEnum = null;
        // @endif
    },

    properties: {

        _atlasAsset: null,

        /**
         * @property atlasAsset
         * @type {AtlasAsset}
         */
        atlasAsset: {
            get: function () {
                return this._atlasAsset;
            },
            set: function (value) {
                this._atlasAsset = value;
                this._skeletonData = null;
                this._skinEnum = null;
            },
            type: AtlasAsset
        },

        _skeletonJson: null,

        /**
         * @property skeletonJson
         * @type {JsonAsset}
         */
        skeletonJson: {
            get: function () {
                return this._skeletonJson;
            },
            set: function (value) {
                this._skeletonJson = value;
                this._skeletonData = null;
                this._skinEnum = null;
            },
            type: Fire.JsonAsset
        },

        /**
         * Scale can be specified on the JSON or binary loader which will scale the bone positions, image sizes, and
         * animation translations.
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
        if (this._skeletonData) {
            return this._skeletonData;
        }

        if (! this.atlasAsset) {
            if (! quiet) {
                Fire.error('AtlasAsset not set for SkeletonDataAsset: "%s"', this.name);
            }
            return null;
        }

        if (! this.skeletonJson) {
            if (! quiet) {
                Fire.error('SkeletonJSON not set for SkeletonDataAsset: "%s"', this.name);
            }
            return null;
        }

        //scale = 1 / cc.director.getContentScaleFactor();

        var atlas = this.atlasAsset.getAtlas();
        if (! atlas) {
            return null;
        }
        var attachmentLoader = new spine.AtlasAttachmentLoader(atlas);
        var skeletonJsonReader = new spine.SkeletonJson(attachmentLoader);
        skeletonJsonReader.scale = this.scale;

        var json = this.skeletonJson.json;
        this._skeletonData = skeletonJsonReader.readSkeletonData(json);
        atlas.dispose(skeletonJsonReader);

        return this._skeletonData;
    },

    // @ifdef EDITOR
    getSkinsEnum: function () {
        if (this._skinEnum) {
            return this._skinEnum;
        }
        var sa = this.getSkeletonData(true);
        if (sa) {
            var skins = sa.skins;
            var enumDef = {};
            for (var i = 0; i < skins.length; i++) {
                var name = skins[i].name;
                enumDef[name] = i;
            }
            this._skinEnum = Fire.defineEnum(enumDef);
            return this._skinEnum;
        }
        return null;
    },
    createEntity: function (cb) {
        var ent = new Fire.Entity(this.name);
        var skeleton = ent.addComponent(Spine.Skeleton);
        skeleton.skeletonData = this;
        if (cb) {
            cb(ent);
        }
    }
    // @endif

});

Spine.SkeletonDataAsset = SkeletonDataAsset;

Fire.addCustomAssetMenu(SkeletonDataAsset, "New Spine SkeletonData");
