function normalizePath (path) {
    if (path.slice(0, 2) === './') {
        path = path.slice(2);
    }
    else if (path[0] === '/') {
        path = path.slice(1);
    }
    return path;
}

/**
 * AssetBundleBase 为 Resources 提供了上层接口，用于加载资源包里的资源。
 * @class AssetBundleBase
 * @constructor
 */
function AssetBundleBase () {
    this._pathToUuid = {};
}

var GLOB = '**/*';
var GLOB_LEN = GLOB.length;

AssetBundleBase._hasWildcard = function (path) {
    var endsWithGlob = path.substr(-GLOB_LEN, GLOB_LEN) === GLOB;
    return endsWithGlob;
};

JS.mixin(AssetBundleBase.prototype, {

    /**
     * Check if the bundle contains a specific object.
     *
     * Note:
     * All asset paths in Fireball use forward slashes, paths using backslashes will not work.
     *
     * @method contains
     * @param {string} path - not support wildcard
     * @return {boolean}
     */
    contains: function (path) {
        return (path in this._pathToUuid);
    },

    /**
     * Return all asset paths in the bundle.
     * @method getAllPaths
     * @return {string[]}
     */
    getAllPaths: function () {
        return Object.keys(this._pathToUuid);
    },

    _loadByWildcard: function (path, callback) {
        var originPath = path.slice(0, -GLOB_LEN);
        var originPathLen = originPath.length;
        var results = [];
        var remain = 0;
        function onLoad (err, asset) {
            if (asset) {
                results.push(asset);
                if (--remain <= 0) {
                    if (callback) {
                        callback(null, results);
                    }
                }
            }
            else {
                // error
                if (callback) {
                    callback(err, results);
                    callback = null;
                }
            }
        }
        var p2u = this._pathToUuid;
        for (var p in p2u) {
            if (p.slice(0, originPathLen) === originPath) {
                ++remain;
                var uuid = p2u[p];
                AssetLibrary.loadAsset(uuid, onLoad);
            }
        }
        return remain > 0;
    },

    /**
     * Loads asset with path from the bundle asynchronously.
     *
     * wildcard:
     * - 如果路径以 &#42;&#42;&#47;&#42; 作为结尾，则该路径下的所有资源都会被加载，含子文件夹。
     *   此时 callback 的第二参数将返回数组，如果文件夹下没有资源，数组长度将会是 0。如果加载出错，数组内的元素将不全。
     *
     * Note:
     * All asset paths in Fireball use forward slashes, paths using backslashes will not work.
     *
     * @method load
     * @param {string} path
     * @param {function} [callback]
     * @param {string} callback.param error - null or the error info
     * @param {object} callback.param data - the loaded object or null
     * @param {boolean} [quiet=false] - If true, the callback will not invoked even if asset is not found.
     * @return {boolean} start loading
     */
    load: function (path, callback, quiet) {
        if (! path) {
            if (! quiet) {
                callInNextTick(callback, 'Argument must be non-nil', null);
            }
            return false;
        }
        path = normalizePath(path);
        var uuid = this._pathToUuid[path];
        if (uuid) {
            AssetLibrary.loadAsset(uuid, callback);
            return true;
        }
        else if (AssetBundleBase._hasWildcard(path)) {
            var loading = this._loadByWildcard(path, callback);
            if ( !loading && !quiet ) {
                callInNextTick(callback, null, []);
            }
            return loading;
        }
        else if (! quiet) {
            callInNextTick(callback, 'Path not exists', null);
            return false;
        }
    },

    ///**
    // * The load method that should be implemented by sub class
    // * @method _doLoad
    // * @param {string} uuid
    // * @param {function} callback
    // * @param {string} callback.param error - null or the error info
    // * @param {object} callback.param data - the loaded object or null
    // * @private
    // */
    //_loader: function (uuid, callback) {
    //    callback('NYI', null);
    //}

    /**
     * @method _add
     * @param {string} path - the path to load, should NOT include filename extensions.
     * @param {string} uuid
     * @private
     */
    _add: function (path, uuid) {
        //// remove extname
        //// (can not use slice because length of extname maybe 0)
        //path = path.substring(0, path - Fire.Path.extname(path).length);
        this._pathToUuid[path] = uuid;
    },
    _removeByPath: function (path) {
        delete this._pathToUuid[path];
    }
    //_removeByUuid: function (uuid) {
    //    for (var path in this._pathToUuid) {
    //        if (this._pathToUuid[path] === uuid) {
    //            delete this._pathToUuid[path];
    //            return;
    //        }
    //    }
    //}
});

/**
 * 这个加载类用于在运行时访问项目里的 Resources 目录
 * @class ResourcesBundle
 * @constructor
 * @extends AssetBundleBase
 */
function ResourcesBundle () {
    AssetBundleBase.call(this);
}
JS.extend(ResourcesBundle, AssetBundleBase);

// @ifdef EDITOR
//ResourcesBundle.isResPath = function (path) {
//    //path = path.toLowerCase();
//    path = path.replace(/\\/g, '/');
//    return path.indexOf('Resources/') === 0 || path.indexOf('/Resources/') !== -1;
//};
// @endif

JS.mixin(ResourcesBundle.prototype, {

    init: function (pathToUuid) {
        JS.mixin(this._pathToUuid, pathToUuid);
    }

    // @ifdef EDITOR

    //isResUrl: function (url) {
    //    var path = url.substr(url.indexOf('://') + 3);
    //    return this.isResPath(path);
    //},

    //onAssetCreated: function (url, uuid) {
    //    var path = url.substr(url.indexOf('://') + 3);
    //    if (ResourcesBundle.isResPath(path)) {
    //        this._add(path, uuid);
    //    }
    //}
    // @endif
});

/**
 * Resources 模块允许你在运行时动态加载资源。资源以路径的形式标识，路径不能包含文件后缀名。
 * Resources 能够使用路径加载项目里所有 `Resources` 目录下的资源，例如 `sprites/npc/001`。
 * @class Resources
 * @static
 */
var Resources = {

    // {
    //     baseDir: {string},
    //     bundle: {AssetBundleBase},
    // }
    _mounts: [],

    /**
     * @property _resBundle
     * @type ResourcesBundle
     */
    _resBundle: new ResourcesBundle(),

    /**
     * Note:
     * All asset paths in Fireball use forward slashes, paths using backslashes will not work.
     *
     * @method mount
     * @param {string} baseDir
     * @param {AssetBundleBase} bundle
     * @private
     */
    mount: function (baseDir, bundle) {
        if (! baseDir && baseDir !== '') {
            Fire.error('Invalid baseDir');
        }
        // trim path
        baseDir = normalizePath(baseDir);
        if (baseDir.slice(-1) === '/') {
            baseDir = baseDir.slice(0, -1);
        }
        //
        this._mounts.push({
            baseDir: baseDir,
            bundle: bundle
        });
    },

    /**
     * Loads asset with path from resources asynchronously.
     *
     * Note:
     * All asset paths in Fireball use forward slashes, paths using backslashes will not work.
     *
     * @method load
     * @param {string} path
     * @param {function} callback
     * @param {string} callback.param error - null or the error info
     * @param {object} callback.param data - the loaded object or null
     */
    load: function (path, callback) {
        if (! path) {
            return callback('Argument must be non-nil', null);
        }
        path = normalizePath(path);

        var mounts = this._mounts;
        for (var i = mounts.length - 1; i >= 0; i--) {
            var item = mounts[i];
            var baseDir = item.baseDir;
            var bundle = item.bundle;
            if (baseDir === "") {
                if (bundle.load(path, callback, true)) {
                    return;
                }
            }
            else if (path.slice(0, baseDir.length) === baseDir) {
                var relative = path.slice(baseDir.length + 1);
                if (bundle.load(relative, callback, true)) {
                    return;
                }
            }
        }

        // not found
        if (callback) {
            if (AssetBundleBase._hasWildcard(path)) {
                return callback(null, []);
            }
            else {
                return callback('Path:' + path + ' not exists', null);
            }
        }
    }
};

Fire.Resources = Resources;

// mount resources by default

Resources.mount('', Resources._resBundle);
