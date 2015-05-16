// @ifdef EDITOR

(function () {

    if (!Fire.isEditor) {
        return;
    }

    var Url = require('fire-url');
    var Path = require('path');
    var Ipc = require('ipc');

    // implements a fake texture loader to load texture asset
    var TextureLoader = Fire.Class({
        /**
         * @class TextureLoader
         * @constructor
         * @param {string} atlasUrl
         */
        constructor: function () {
            /**
             * @property {Texture[]} textures - the loaded texture array
             */
            this.textures = [];
            this.atlasUrl = arguments[0];
        },
        load: function (page, line) {
            var name = Path.basename(line);
            var baseUrl = Url.dirname(this.atlasUrl);
            var url = Url.join(baseUrl, name);
            var uuid = Editor.AssetDB.urlToUuid(url);
            if (!uuid) {
                Fire.error('Texture with name "%s" not found for atlas asset: "%s"', line, this.atlasUrl);
                return;
            }
            var texture = Editor.serialize.asAsset(uuid);
            this.textures.push(texture);
        },
        unload: function () {
        }
    });

    Spine.AtlasAsset.import = function (url, uuid, callback) {
        Fire.AssetLibrary.loadAssetInEditor(uuid, function (error, rawAsset) {
            if (error) {
                Fire.error(error);
                return;
            }
            var newAsset = new Spine.AtlasAsset();
            newAsset.atlasFile = rawAsset;

            var textureLoader = new TextureLoader(url);
            var tmpSpineAtlas = new spine.Atlas(rawAsset.text, textureLoader);
            newAsset.textures = textureLoader.textures;

            var baseUrl = Url.dirname(url);
            var name = Url.basenameNoExt(url);
            var newAssetUrl = Url.join(baseUrl, name + '.asset');
            callback(newAsset, newAssetUrl);
        });
    };

    Spine.SkeletonDataAsset.import = function (url, jsonUuid, callback) {
        function doCreate () {
            var newAsset = new Spine.SkeletonDataAsset();
            newAsset.atlasAsset = Editor.serialize.asAsset(atlasAssetUuid);
            newAsset.skeletonJson = Editor.serialize.asAsset(jsonUuid);

            var newAssetUrl = Url.join(baseUrl, name + '.asset');
            callback(newAsset, newAssetUrl);
        }
        var baseUrl = Url.dirname(url);
        var name = Url.basenameNoExt(url);
        var atlasAssetUrl = Url.join(baseUrl, name + '.atlas.asset');
        var atlasAssetUuid = Editor.AssetDB.urlToUuid(atlasAssetUrl);
        if (atlasAssetUuid) {
            doCreate();
        }
        else {
            // import atlas
            var atlasUrl = Url.join(baseUrl, name + '.atlas.txt');
            var atlasUuid = Editor.AssetDB.urlToUuid(atlasUrl);
            if (!atlasUuid) {
                Fire.warn('Can not find the atlas file "%s"', atlasUrl);
                return;
            }
            Fire.Spine.AtlasAsset.import(atlasUrl, atlasUuid, function (newAsset, destUrl) {
                Editor.AssetDB.generateUniqueUrl(destUrl, function (uniqueUrl) {
                    Ipc.on('asset:saved', function onAtlasImported (result) {
                        if (result.url === uniqueUrl) {
                            atlasAssetUuid = result.uuid;
                            if (!atlasAssetUuid) {
                                Fire.warn('Failed to create atlas asset');
                                return;
                            }
                            doCreate();
                            Ipc.removeListener('asset:saved', onAtlasImported);
                        }
                    });
                    Editor.AssetDB.save(uniqueUrl, Editor.serialize(newAsset));
                });
            });
        }
    };
})();
// @endif
