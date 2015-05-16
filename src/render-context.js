// @ifndef PLAYER

/**
 * The abstract renderer class which will be totally replaced with runtime implementation.
 * here just used as the mocker for unit tests.
 *
 * @class RenderContext
 * @constructor
 * @namespace _Runtime
 *
 * @param {number} width
 * @param {number} height
 * @param {Canvas} [canvas]
 * @param {boolean} [transparent = false]
 * @private
 */
var RenderContext = function (width, height, canvas, transparent) {
    this._camera = null;
    this._size = Fire.v2(width, height);
    this._canvas = canvas || document.createElement('canvas');
};

RenderContext.initRenderer = function (renderer) {
    renderer._renderObj = null;
    renderer._renderObjInScene = null;
    renderer._tempMatrix = new Fire.Matrix23();
};

// properties

Fire.JS.get(RenderContext.prototype, 'canvas',
    function () {
        return this._canvas;
    }
);

/**
 * The canvas's parent node in dom.
 * @property _container
 * @type {HTMLElement}
 * @private
 */
JS.get(RenderContext.prototype, 'container', function () {
    return this.canvas.parentNode;
});

//Object.defineProperty(RenderContext.prototype, 'width', {
//    get: function () {
//        return this.width;
//    },
//    set: function (value) {
//        this.height = value;
//    }
//});
//
//Object.defineProperty(RenderContext.prototype, 'height', {
//    get: function () {
//        return this.renderer.height;
//    },
//    set: function (value) {
//        this.renderer.resize(this.renderer.width, value);
//    }
//});

Fire.JS.getset(RenderContext.prototype, 'size',
    function () {
        return this._size.clone();
    },
    function (value) {
        this._size = value.clone();
    }
);

//Object.defineProperty(RenderContext.prototype, 'background', {
//    set: function (value) {
//        this.stage.setBackgroundColor(value.toRGBValue());
//    }
//});

Fire.JS.getset(RenderContext.prototype, 'camera',
    function () {
        return this._camera;
    },
    function (value) {
        this._camera = value;
    }
);

Fire.JS.mixin(RenderContext.prototype, {

    onSceneLoaded: function (scene) { },
    onSceneLaunched: function (scene) { },

    /**
     * @param {Entity} entity
     * @param {number} oldIndex
     * @param {number} newIndex
     */
    onEntityIndexChanged: function (entity, oldIndex, newIndex) { },

    /**
     * @param {Entity} entity
     * @param {Entity} oldParent
     */
    onEntityParentChanged: function (entity, oldParent) {},

    /**
     * removes a entity and all its children from scene
     * @param {Entity} entity
     */
    onEntityRemoved: function (entity) { },

    /**
     * @param {Entity} entity
     */
    onRootEntityCreated: function (entity) { },

    /**
     * create pixi nodes recursively
     * @param {Entity} entity
     * @param {boolean} addToScene - add to pixi stage now if entity is root
     */
    onEntityCreated: function (entity, addToScene) {},

    /**
     * @param {SpriteRenderer} target
     */
    addSprite: function (target) {},

    /**
     * @param {SpriteRenderer} target
     * @param {boolean} show
     */
    show: function (target, show) {},

    /**
     * @param target {SpriteRenderer}
     * @param show {boolean}
     */
    remove: function (target) {},

    onPreRender: function () {},
    render: function () {},

    /**
     * Set the final transform to render
     * @param {SpriteRenderer} target
     * @param {Matrix23} matrix - the matrix to render (Read Only)
     */
    updateTransform: function (target, matrix) {},

    updateColor: function (target) {},

    /**
     * @param target {SpriteRenderer}
     */
    updateMaterial: function (target) {},

    /**
     * The debugging method that checks whether the render context matches the current scene or not.
     * @throws {string} error info
     */
    checkMatchCurrentScene: function () {}
});

Runtime.RenderContext = RenderContext;

// @endif
