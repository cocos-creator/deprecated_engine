
/**
 * @property {object} Spine - The [Spine module](./Fire.Spine.html).
 */
/**
 * The namespace of Spine, all classes, functions, properties and constants of Spine are defined in this
 * module.
 *
 * @module Fire.Spine
 * @main Fire.Spine
 */
var Spine = {
    _DefaultSkinsEnum: Fire.defineEnum({ default: -1 }),
    _DefaultAnimsEnum: Fire.defineEnum({ '<None>': 0 })
};
Fire.Spine = Spine;

var AtlasAsset = (function () {

    // implements a simple texture loader
    var TextureLoader = Fire.Class({
        /**
         * @param {SpineAtlasAsset} atlas
         */
        constructor: function () {
            var atlas = arguments[0];
            this.atlas = atlas;
        },
        getTexture: function (line) {
            //var path = cc.path.join(cc.path.dirname(atlasDir), line);
            var name = cc.path.mainFileName(line);
            for (var i = 0; i < this.atlas.textures.length; i++) {
                var tex = this.atlas.textures[i];
                if (tex.name === name) {
                    return tex;
                }
            }
            return null;
        },
        load: function (page, line) {
            var tex = this.getTexture(line);
            if (! tex) {
                Fire.error('Texture with name "%s" not found for atlas asset: "%s"', line, this.name);
                return;
            }
            var ccTex = new cc.Texture2D();
            ccTex.initWithElement(tex.image);

            if (cc.game.renderType === cc.Game.RENDER_TYPE_WEBGL) {
                page.rendererObject = new cc.TextureAtlas(ccTex, 128);
                page.width = ccTex.getPixelsWide();
                page.height = ccTex.getPixelsHigh();
            }
            else {
                page._texture = ccTex;
            }
        },
        unload: function () {
        }
    });

    /**
     * @class AtlasAsset
     * @extends CustomAsset
     * @constructor
     */
    var AtlasAsset = Fire.Class({

        name: 'Fire.Spine.AtlasAsset',
        extends: Fire.CustomAsset,

        constructor: function () {
            /**
             * @property atlas
             * @type {spine.Atlas}
             */
            this.atlas = null;
        },
        properties: {
            /**
             * @property textures
             * @type {Texture[]}
             */
            textures: {
                default: [],
                type: Texture
            },
            /**
             * @property atlasFile
             * @type {TextAsset}
             */
            atlasFile: {
                default: null,
                type: Fire.TextAsset
            }
        },

        /**
         * @method getAtlas
         * @return {spine.Atlas}
         */
        getAtlas: function () {
            if (! this.atlasFile) {
                Fire.error('Atlas file not set for atlas asset: ' + this.name);
                this.atlas = null;
                return null;
            }
            if (! (this.textures && this.textures.length > 0)) {
                Fire.error('Textures not set for atlas asset: ' + this.name);
                this.atlas = null;
                return null;
            }

            if (! this.atlas) {
                this.atlas = new spine.Atlas(this.atlasFile.text, new TextureLoader(this));
            }
            return this.atlas;
        }
    });


    return AtlasAsset;
})();

Spine.AtlasAsset = AtlasAsset;

Fire.addCustomAssetMenu(AtlasAsset, "New Spine Atlas");
