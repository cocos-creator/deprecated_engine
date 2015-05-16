/**
 * The asset library which managing loading/unloading assets in project.
 *
 * @class AssetLibrary
 * @static
 */
var AssetLibrary = (function () {

    // configs

    var _libraryBase = '';

    // variables

    // the loading uuid's callbacks
    var _uuidToCallbacks = new Fire.CallbacksInvoker();

    // temp deserialize info
    var _tdInfo = new Fire._DeserializeInfo();

    // create a loading context which reserves all relevant parameters
    function LoadingHandle (readMainCache, writeMainCache) {
        this.readMainCache = readMainCache;
        this.writeMainCache = writeMainCache;
        var needIndieCache = !(this.readMainCache && this.writeMainCache);
        this.taskIndieCache = needIndieCache ? {} : null;
    }
    LoadingHandle.prototype.readCache = function (uuid) {
        if (this.readMainCache && this.writeMainCache) {
            return AssetLibrary._uuidToAsset[uuid];
        }
        else {
            if (this.readMainCache) {
                // writeMainCache == false
                return AssetLibrary._uuidToAsset[uuid] || this.taskIndieCache[uuid];
            }
            else {
                return this.taskIndieCache[uuid];
            }
        }
    };
    LoadingHandle.prototype.writeCache = function (uuid, asset) {
        if (this.writeMainCache) {
            AssetLibrary._uuidToAsset[uuid] = asset;
        }
        if (this.taskIndieCache) {
            this.taskIndieCache[uuid] = asset;
        }
    };

    // publics

    var AssetLibrary = {
        /**
         * @callback loadCallback
         * @param {string} error - null or the error info
         * @param {Asset} data - the loaded asset or null
         */

        /**
         * @method loadAsset
         * @param {string} uuid
         * @param {loadCallback} callback - the callback function once load finished
         * @param {boolean} [readMainCache=true] - If false, the asset and all its depends assets will reload and create new instances from library.
         * @param {boolean} [writeMainCache=true] - If true, the result will cache to AssetLibrary, and MUST be unload by user manually.
         * @param {Asset} [existingAsset] - load to existing asset, this argument is only available in editor
         * @private
         */
        loadAsset: function (uuid, callback, readMainCache, writeMainCache, existingAsset) {
            readMainCache = typeof readMainCache !== 'undefined' ? readMainCache : true;
            writeMainCache = typeof writeMainCache !== 'undefined' ? writeMainCache : true;

            var handle = new LoadingHandle(readMainCache, writeMainCache);
            this._loadAssetByUuid(uuid, callback, handle, existingAsset);
        },

        _LoadingHandle: LoadingHandle,

        /**
         * !#zh uuid加载流程：
         * 1. 查找_uuidToAsset，如果已经加载过，直接返回
         * 2. 查找_uuidToCallbacks，如果已经在加载，则注册回调，直接返回
         * 3. 如果没有url，则将uuid直接作为路径
         * 4. 递归加载Asset及其引用到的其它Asset
         *
         * @method _loadAssetByUuid
         * @param {string} uuid
         * @param {loadCallback} callback - the callback to receive the asset, can be null
         * @param {LoadingHandle} handle - the loading context which reserves all relevant parameters
         * @param {Asset} [existingAsset] - load to existing asset, this argument is only available in editor
         * @private
         */
        _loadAssetByUuid: function (uuid, callback, handle, existingAsset) {
            if (typeof uuid !== 'string') {
                callInNextTick(callback, '[AssetLibrary] uuid must be string', null);
                return;
            }
            // step 1
            if ( !existingAsset ) {
                var asset = handle.readCache(uuid);
                if (asset) {
                    callInNextTick(callback, null, asset);
                    return;
                }
            }

            // step 2
            // 如果必须重新加载，则不能合并到到 _uuidToCallbacks，否则现有的加载成功后会同时触发回调，
            // 导致提前返回的之前的资源。
            var canShareLoadingTask = handle.readMainCache && !existingAsset;
            if ( canShareLoadingTask && !_uuidToCallbacks.add(uuid, callback) ) {
                // already loading
                return;
            }

            // step 3

            // @ifdef EDITOR
            if (!_libraryBase) {
                callInNextTick(callback, 'Cannot load ' + uuid + ' in editor because AssetLibrary not yet initialized!', null);
                return;
            }
            // @endif
            var url = _libraryBase + uuid.substring(0, 2) + Fire.Path.sep + uuid;

            // step 4
            LoadManager.loadByLoader(JsonLoader, url,
                function (error, json) {
                    function onDeserializedWithDepends (err, asset) {
                        if (asset) {
                            asset._uuid = uuid;
                            handle.writeCache(uuid, asset);
                        }
                        if ( canShareLoadingTask ) {
                            _uuidToCallbacks.invokeAndRemove(uuid, err, asset);
                        }
                        else if (callback) {
                            callback(err, asset);
                        }
                    }
                    if (json) {
                        AssetLibrary._deserializeWithDepends(json, url, onDeserializedWithDepends, handle, existingAsset);
                    }
                    else {
                        onDeserializedWithDepends(error, null);
                    }
                }
            );
        },

        /**
         * @method loadJson
         * @param {string|object} json
         * @param {loadCallback} callback
         * @param {boolean} [dontCache=false] - If false, the result will cache to AssetLibrary, and MUST be unload by user manually.
         * @private
         */
        loadJson: function (json, callback, dontCache) {
            var handle = new LoadingHandle(!dontCache, !dontCache);
            this._deserializeWithDepends(json, '', callback, handle);
        },

        /**
         * @method _deserializeWithDepends
         * @param {string|object} json
         * @param {string} url
         * @param {loadCallback} callback
         * @param {object} handle - the loading context which reserves all relevant parameters
         * @param {Asset} [existingAsset] - existing asset to reload
         * @private
         */
        _deserializeWithDepends: function (json, url, callback, handle, existingAsset) {
            // deserialize asset
            var isScene = json && json[0] && json[0].__type__ === JS._getClassId(Scene);
            var classFinder = isScene ? Fire._MissingScript.safeFindClass : function (id) {
                var cls = JS._getClassById(id);
                if (cls) {
                    return cls;
                }
                Fire.warn('Can not get class "%s"', id);
                return Object;
            };
            Engine._canModifyCurrentScene = false;
            var asset = Fire.deserialize(json, _tdInfo, {
                classFinder: classFinder,
                target: existingAsset
            });
            Engine._canModifyCurrentScene = true;

            // load depends
            var pendingCount = _tdInfo.uuidList.length;

            // load raw
            var rawProp = _tdInfo.rawProp;     // _tdInfo不能用在回调里！
            if (rawProp) {
                // load depends raw objects
                var attrs = Fire.attr(asset.constructor, _tdInfo.rawProp);
                var rawType = attrs.rawType;
                ++pendingCount;
                LoadManager.load(url, rawType, asset._rawext, function onRawObjLoaded (error, raw) {
                    if (error) {
                        Fire.error('[AssetLibrary] Failed to load %s of %s. %s', rawType, url, error);
                    }
                    asset[rawProp] = raw;
                    --pendingCount;
                    if (pendingCount === 0) {
                        callback(null, asset);
                    }
                });
            }

            if (pendingCount === 0) {
                callback(null, asset);
            }

            /*
             如果依赖的所有资源都要重新下载，批量操作时将会导致同时执行多次重复下载。优化方法是增加一全局事件队列，
             队列保存每个任务的注册，启动，结束事件，任务从注册到启动要延迟几帧，每个任务都存有父任务。
             这样通过队列的事件序列就能做到合并批量任务。
             如果依赖的资源不重新下载也行，但要判断是否刚好在下载过程中，如果是的话必须等待下载完成才能结束本资源的加载，
             否则外部获取到的依赖资源就会是旧的。
             */

            // @ifdef EDITOR
            // AssetLibrary._loadAssetByUuid 的回调有可能在当帧也可能延后执行，这里要判断是否由它调用 callback，
            // 否则 callback 可能会重复调用
            var invokeCbByDepends = false;
            // @endif

            // load depends assets
            for (var i = 0, len = _tdInfo.uuidList.length; i < len; i++) {
                var dependsUuid = _tdInfo.uuidList[i];
                // @ifdef EDITOR
                if (existingAsset) {
                    var existingDepends = _tdInfo.uuidObjList[i][_tdInfo.uuidPropList[i]];
                    if (existingDepends && existingDepends._uuid === dependsUuid) {
                        var dependsUrl = _libraryBase + dependsUuid.substring(0, 2) + Fire.Path.sep + dependsUuid;
                        if ( !LoadManager.isLoading(dependsUrl, true) ) {
                            // 如果有依赖但依赖不在加载过程中就直接略过
                            --pendingCount;
                        }
                        else {
                            // 等待依赖加载完成
                            (function (dependsUrl) {
                                var idToClear = setInterval(function () {
                                    if ( !LoadManager.isLoading(dependsUrl, true) ) {
                                        clearInterval(idToClear);
                                        --pendingCount;
                                        if (pendingCount === 0) {
                                            callback(null, asset);
                                        }
                                    }
                                }, 10);
                            })(dependsUrl);
                        }
                        continue;
                    }
                }
                // @endif
                var onDependsAssetLoaded = (function (dependsUuid, obj, prop) {
                    // create closure manually because its extremely faster than bind
                    return function (error, dependsAsset) {
                        if (error) {
                            // @ifdef EDITOR
                            if (Editor.AssetDB && Editor.AssetDB.isValidUuid(dependsUuid)) {
                                Fire.error('[AssetLibrary] Failed to load "%s", %s', dependsUuid, error);
                            }
                            // @endif
                        }
                        //else {
                        //    dependsAsset._uuid = dependsUuid;
                        //}
                        // update reference
                        obj[prop] = dependsAsset;
                        // check all finished
                        --pendingCount;
                        if (pendingCount === 0) {
                            callback(null, asset);
                        }
                    };
                })( dependsUuid, _tdInfo.uuidObjList[i], _tdInfo.uuidPropList[i] );
                AssetLibrary._loadAssetByUuid(dependsUuid, onDependsAssetLoaded, handle);
                invokeCbByDepends = true;
            }

            // @ifdef EDITOR
            if ( !invokeCbByDepends && pendingCount === 0) {
                callback(null, asset);
            }
            // @endif

            // _tdInfo 是用来重用临时对象，每次使用后都要重设，这样才对 GC 友好。
            _tdInfo.reset();
        },

        /**
         * Get the exists asset by uuid.
         *
         * @method getAssetByUuid
         * @param {string} uuid
         * @return {Asset} - the existing asset, if not loaded, just returns null.
         * @private
         */
        getAssetByUuid: function (uuid) {
            return AssetLibrary._uuidToAsset[uuid] || null;
        },

        /**
         * !#en Kill references to the asset so it can be garbage collected.
         * Fireball will reload the asset from disk or remote if loadAssetByUuid being called again.
         * You rarely use this function in scripts, since it will be called automatically when the Asset is destroyed.
         * !#zh 手动卸载指定的资源，这个方法会在 Asset 被 destroy 时自动调用，一般不需要用到这个方法。卸载以后，Fireball 可以重新从硬盘或网络加载这个资源。
         *
         * 如果还有地方引用到asset，除非 destroyImmediated 为true，否则不应该执行这个方法，因为那样可能会导致 asset 被多次创建。
         *
         * @method unloadAsset
         * @param {Asset|string} assetOrUuid
         * @param {boolean} [destroy=false] - When destroyImmediate is true, if there are objects referencing the asset, the references will become invalid.
         */
        unloadAsset: function (assetOrUuid, destroy) {
            var asset;
            if (typeof assetOrUuid === 'string') {
                asset = AssetLibrary._uuidToAsset[assetOrUuid];
            }
            else {
                asset = assetOrUuid;
            }
            if (asset) {
                if (destroy && asset.isValid) {
                    asset.destroy();
                }
                delete AssetLibrary._uuidToAsset[asset._uuid];
            }
        },

        /**
         * init the asset library
         * @method init
         * @param {string} libraryPath
         */
        init: function (libraryPath) {
// @ifdef EDITOR
            if (_libraryBase && !Fire.isUnitTest) {
                Fire.error('AssetLibrary has already been initialized!');
                return;
            }
// @endif
            _libraryBase = Fire.Path.setEndWithSep(libraryPath);
            //Fire.log('[AssetLibrary] library: ' + _libraryBase);
        }

        ///**
        // * temporary flag for deserializing assets
        // * @property {boolean} Fire.AssetLibrary.isLoadingAsset
        // */
        //isLoadingAsset: false,
    };

    // unload asset if it is destoryed

    /**
     * !#en Caches uuid to all loaded assets in scenes.
     *
     * !#zh 这里保存所有已经加载的场景资源，防止同一个资源在内存中加载出多份拷贝。
     *
     * 这里用不了WeakMap，在浏览器中所有加载过的资源都只能手工调用 unloadAsset 释放。
     *
     * 参考：
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap
     * https://github.com/TooTallNate/node-weak
     *
     * @property _uuidToAsset
     * @type {object}
     * @private
     */
    AssetLibrary._uuidToAsset = {};

    // @ifdef DEV
    if (Asset.prototype._onPreDestroy) {
        Fire.error('_onPreDestroy of Asset has already defined');
    }
    // @endif
    Asset.prototype._onPreDestroy = function () {
        if (AssetLibrary._uuidToAsset[this._uuid] === this) {
            AssetLibrary.unloadAsset(this);
        }
    };

    return AssetLibrary;
})();

Fire.AssetLibrary = AssetLibrary;
