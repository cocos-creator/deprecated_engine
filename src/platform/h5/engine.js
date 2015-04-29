
var Engine = (function () {

    /**
     * !#zh 这个静态模块提供引擎运行时的一些全局接口和状态状态。
     * !#en Access to engine runtime data.
     * This class contains static methods for looking up information about and controlling the runtime data.
     *
     * @class Engine
     * @static
     * @extends Playable
     */
    var Engine = {
// @ifdef EDITOR
        _editorCallback: editorCallback
// @endif
    };
    Playable.call(Engine);
    JS.mixin(Engine, Playable.prototype);

    var loadingScene = '';

    // We should use this id to cancel ticker, otherwise if the engine stop and replay immediately,
    // last ticker will not cancel correctly.
    var requestId = -1;

    /**
     * !#en the active scene
     * !#zh 当前激活的场景。
     *
     * 如果为空，一般是因为正在加载场景或Entity(例如执行Fire.deserialize)。
     * 这样是为了防止加载中的东西不小心影响到当前场景。一般代码不用关心这个问题，但大部分构造函数里执行的代码，
     * 如果涉及到场景物件的操作，都要注意这点。
     * 也就是说构造函数调用到的代码如果要操作 Engine._scene，必须判断非空，如果操作不直接针对 Engine._scene，
     * 也可以判断 Engine._canModifyCurrentScene。
     * 另外，如果存在辅助场景，当在辅助场景内创建物件时，Engine._scene会被临时修改为辅助场景。
     *
     * @property _scene
     * @type {Scene}
     * @private
     */
    Engine._scene = null;

    // temp array contains persistent entities
    Engine._dontDestroyEntities = [];

    /**
     * The RenderContext attached to game or game view.
     * @property _renderContext
     * @type {_Runtime.RenderContext}
     * @private
     */
    Engine._renderContext = null;

    /**
     * The InteractionContext attached to game or game view.
     * @property _interactionContext
     * @type {InteractionContext}
     * @private
     */
    Engine._interactionContext = null;

    /**
     * the render context currently rendering
     * @property _curRenderContext
     * @type {_Runtime.RenderContext}
     * @private
     */
    Engine._curRenderContext = null;

    /**
     * The InputContext attached to game or game view.
     * @property _inputContext
     * @type {InputContext}
     * @private
     */
    Engine._inputContext = null;

    /**
     */

    /**
     * is loading scene?
     * @property isLoadingScene
     * @type {boolean}
     * @readOnly
     */
    JS.get(Engine, 'loadingScene', function () {
        return loadingScene;
    });

    var lockingScene = null;

    /**
     * !#en You should check whether you can modify the scene in constructors which may called by the engine while
     * deserializing.
     * !#zh 这个属性用来判断场景物体的构造函数执行时是否可以把物体加到场景里。
     * 这个属性和 Fire._isCloning 很类似。但这里关注的是场景是否能修改，而 Fire._isCloning 强调的是持有的对象是否需要重新创建。
     * @property _canModifyCurrentScene
     * @type {boolean}
     * @private
     */
    JS.getset(Engine, '_canModifyCurrentScene',
        function () {
            return !lockingScene;
        },
        function (value) {
            if (value) {
                // unlock
                this._scene = lockingScene;
                lockingScene = null;
            }
            else {
                // lock
                if (this._scene && lockingScene) {
                    Fire.error('another scene still locked: ' + lockingScene.name);
                }
                lockingScene = this._scene;
                this._scene = null;
            }
        }
    );

    var inited = false;

    /**
     * @property inited
     * @type {boolean}
     * @readOnly
     */
    JS.get(Engine, 'inited', function () {
        return inited;
    });

    // Scene name to uuid
    Engine._sceneInfos = {};

    // functions

    /**
     * Initialize the engine. This method will be called by boot.js or editor.
     * @method init
     * @param {number} [width]
     * @param {number} [height]
     * @param {Canvas} [canvas]
     * @param {object} [options]
     * @return {_Runtime.RenderContext}
     */
    Engine.init = function ( w, h, canvas, options ) {
        if (inited) {
            Fire.error('Engine already inited');
            return;
        }
        inited = true;

        Engine._renderContext = new Runtime.RenderContext( w, h, canvas );
        Engine._interactionContext = new InteractionContext();

        Runtime.init();

// @ifdef EDITOR
        if (Fire.isEditor === false) {
            // test in other platform
            Engine._scene = new Scene();
            //if (editorCallback.onSceneLoaded) {
            //    editorCallback.onSceneLoaded(Engine._scene);
            //}
            editorCallback.onSceneLaunched(Engine._scene);
        }
// @endif

        if (options) {
            JS.mixin(Engine._sceneInfos, options.scenes);
            Resources._resBundle.init(options.resBundle);
        }
        return Engine._renderContext;
    };

// @ifdef EDITOR
    Engine.onError = function (error) {
        switch (error) {
            case 'already-playing':
                Fire.warn('Fireball is already playing');
                break;
        }
    };
    Engine.onResume = function () {
        editorCallback.onEnginePlayed(true);
    };
    Engine.onPause = function () {
        editorCallback.onEnginePaused();
    };
// @endif

    Engine.onPlay = function () {
        Engine._inputContext = new InputContext(Engine._renderContext);
        var now = Ticker.now();
        Time._restart(now);
        this.update();

// @ifdef EDITOR
        editorCallback.onEnginePlayed(false);
// @endif
    };

    Engine.onStop = function () {
        FObject._deferredDestroy();

        Engine._inputContext.destruct();
        Engine._inputContext = null;

        Input._reset();

        // reset states
        loadingScene = ''; // TODO: what if loading scene ?
        if (requestId !== -1) {
            Ticker.cancelAnimationFrame(requestId);
            requestId = -1;
        }

// @ifdef EDITOR
        editorCallback.onEngineStopped();
// @endif
    };

    function doUpdate (updateLogic) {
        if (Engine._scene) {
            if (updateLogic) {
                Engine._scene.update();
                FObject._deferredDestroy();
            }
            Runtime.render();

            // update interaction context
            Engine._interactionContext.update(Engine._scene.entities);
        }
    }

    /**
     * @method update
     * @private
     */
    Engine.update = function (unused) {
        if (!Engine._isPlaying) {
            return;
        }
        requestId = Ticker.requestAnimationFrame(Engine.update);    // no bind this

        //if (sceneLoadingQueue) {
        //    return;
        //}

        var updateLogic = !Engine._isPaused || Engine._stepOnce;
        var now = Ticker.now();
        Time._update(now, !updateLogic, Engine._stepOnce ? 1 / 60 : 0);
        Engine._stepOnce = false;

        doUpdate(updateLogic);

// @ifdef DEV
        if (__TESTONLY__.update) {
            __TESTONLY__.update(updateLogic);
        }
// @endif
    };

    /**
     * Launch loaded scene.
     * @method _launchScene
     * @param {Scene} scene
     * @param {function} [onBeforeLoadScene]
     * @private
     */
    Engine._launchScene = function (scene, onBeforeLoadScene) {
        if (!scene) {
            Fire.error('Argument must be non-nil');
            return;
        }
        Engine._dontDestroyEntities.length = 0;

        // unload scene
        var oldScene = Engine._scene;
// @ifdef EDITOR
        editorCallback.onStartUnloadScene(oldScene);
// @endif

        if (Fire.isValid(oldScene)) {
            // destroyed and unload
            AssetLibrary.unloadAsset(oldScene, true);
        }

        // purge destroyed entities belongs to old scene
        FObject._deferredDestroy();

        Engine._scene = null;

        if (onBeforeLoadScene) {
            onBeforeLoadScene();
        }

        // init scene
        Engine._renderContext.onSceneLoaded(scene);
// @ifdef EDITOR
        //if (editorCallback.onSceneLoaded) {
        //    editorCallback.onSceneLoaded(scene);
        //}
// @endif

        // launch scene
        scene.entities = scene.entities.concat(Engine._dontDestroyEntities);
        Engine._dontDestroyEntities.length = 0;
        Engine._scene = scene;
        Engine._renderContext.onSceneLaunched(scene);

// @ifdef EDITOR
        editorCallback.onBeforeActivateScene(scene);
// @endif

        scene.activate();

// @ifdef EDITOR
        editorCallback.onSceneLaunched(scene);
// @endif
    };

    /**
     * Loads the scene by its name.
     * @method loadScene
     * @param {string} sceneName - the name of the scene to load
     * @param {function} [onLaunched] - callback, will be called after scene launched
     * @param {function} [onUnloaded] - callback, will be called when the previous scene was unloaded
     * @return {boolean} if error, return false
     */
    Engine.loadScene = function (sceneName, onLaunched, onUnloaded) {
        if (loadingScene) {
            Fire.error('[Engine.loadScene] Failed to load scene "%s" because "%s" is already loading', sceneName, loadingScene);
            return false;
        }
        var uuid = Engine._sceneInfos[sceneName];
        if (uuid) {
            loadingScene = sceneName;
            Engine._loadSceneByUuid(uuid, onLaunched, onUnloaded);
            return true;
        }
        else {
            Fire.error('[Engine.loadScene] The scene "%s" can not be loaded because it has not been added to the build settings.', sceneName);
            return false;
        }
    };

    /**
     * Loads the scene by its uuid.
     * @method _loadSceneByUuid
     * @param {string} uuid - the uuid of the scene asset to load
     * @param {function} [onLaunched]
     * @param {function} [onUnloaded]
     * @private
     */
    Engine._loadSceneByUuid = function (uuid, onLaunched, onUnloaded) {
        AssetLibrary.unloadAsset(uuid);     // force reload
        AssetLibrary.loadAsset(uuid, function onSceneLoaded (error, scene) {
            if (error) {
                error = 'Failed to load scene: ' + error;
                // @ifdef EDITOR
                console.throw('[test] Failed to load scene');
                // @endif
            }
            else if (!(scene instanceof Fire._Scene)) {
                error = 'The asset ' + uuid + ' is not a scene';
                scene = null;
            }
            if (scene) {
                Engine._launchScene(scene, onUnloaded);
            }
            else {
                Fire.error(error);
            }
            loadingScene = '';
            if (onLaunched) {
                onLaunched(scene, error);
            }
        });
    };

    /**
     * Preloads the scene to reduces loading time. You can call this method at any time you want.
     *
     * After calling this method, you still need to launch the scene by `Engine.loadScene` because the loading logic
     * will not changed. It will be totally fine to call `Engine.loadScene` at any time even if the preloading is not
     * yet finished, the scene will be launched after loaded automatically.
     * @method preloadScene
     * @param {string} sceneName - the name of the scene to preload
     * @param {function} [onLoaded] - callback, will be called after the scene loaded
     * @param {string} onLoaded.param error - null or the error info
     * @param {Asset} onLoaded.param data - the loaded scene or null
     */
    Engine.preloadScene = function (sceneName, onLoaded) {
        var uuid = Engine._sceneInfos[sceneName];
        if (uuid) {
            AssetLibrary.unloadAsset(uuid);     // force reload
            AssetLibrary.loadAsset(uuid, onLoaded);
        }
        else {
            Fire.error('[Engine.preloadScene] The scene "%s" could not be loaded because it has not been added to the build settings.', sceneName);
        }
    };

    return Engine;
})();

Fire.Engine = Engine;

// refine inherited api doc

/**
 * is in player or playing in editor?
 * @property isPlaying
 * @type {boolean}
 * @readOnly
 */
/**
 * is editor currently paused?
 * @property isPaused
 * @type {boolean}
 * @readOnly
 */
/**
 * Start the engine loop. This method will be called by boot.js or editor.
 * @method play
 */
/**
 * Stop the engine loop.
 * @method stop
 */
/**
 * Pause the engine loop.
 * @method pause
 */
/**
 * Perform a single frame step.
 * @method step
 */
