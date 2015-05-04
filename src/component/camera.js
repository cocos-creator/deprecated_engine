/**
 * @class Camera
 * @extends Component
 * @constructor
 */
var Camera = Fire.Class({
    name: 'Fire.Camera',
    extends: Component,
    constructor: function () {
        this._renderContext = null;
        this._contentStrategyInst = null;
    },

    properties: {

        _background: Fire.Color.black,

        /**
         * The color of the screen background.
         * @property background
         * @type {Color}
         * @default Fire.Color.black
         */
        background: {
            get: function () {
                return this._background;
            },
            set: function (value) {
                this._background = value;
                if (this._renderContext) {
                    this._renderContext.background = value;
                }
            }
        },

        _size: 800,

        /**
         * The height of Design Resolution in pixels
         * @property size
         * @type {number}
         * @default 800
         * @beta
         */
        size: {
            get: function () {
                return this._size;
            },
            set: function (value) {
                this._size = value;
            },
            tooltip: "The height of design resolution. Width varies depending on viewport's aspect ratio",
            watch: {
                _contentStrategy: function (obj, propEL) {
                    propEL.disabled = (obj._contentStrategy === Fire.ContentStrategyType.NoScale);
                }
            }
        },

        _contentStrategy: Fire.ContentStrategyType.FixedHeight,

        /**
         * The Content Strategy of the camera.
         * @property contentStrategy
         * @type {ContentStrategyType}
         * @default Fire.ContentStrategyType.FixedHeight
         */
        contentStrategy: {
            type: Fire.ContentStrategyType,
            get: function () {
                return this._contentStrategy;
            },
            set: function (value) {
                this._contentStrategy = value;
                this._contentStrategyInst = Fire.Screen.ContentStrategy.fromType(value);
            },
            displayName: 'Scale Strategy',
            tooltip: "The type of scale strategy for this camera"
        },

        /**
         * @property viewportInfo
         * @type {object}
         * @private
         */
        viewportInfo: {
            get: function (value) {
                var viewportSize = (this._renderContext || Engine._renderContext).size;
                return this._contentStrategyInst.apply(new Vec2(0, this._size), viewportSize);
            },
            visible: false
        },

        /**
         * save the render context this camera belongs to, if null, main render context will be used.
         * @property renderContext
         * @type {_Runtime.RenderContext}
         * @private
         */
        renderContext: {
            set: function (value) {
                this._renderContext = value;
                //// @ifdef EDITOR
                //if ( !Engine.isPlaying ) {
                //    this.size = value.size.y;
                //}
                //// @endif
                this._applyRenderSettings();
            },
            visible: false
        }
    },

    // built-in functions
    onLoad: function () {
        if (!(this.entity._objFlags & HideInGame)) {
            this.renderContext = Engine._renderContext;
        }
        this._contentStrategyInst = Fire.Screen.ContentStrategy.fromType(this._contentStrategy);
    },
    onEnable: function () {
        if (!(this.entity._objFlags & HideInGame)) {
            Engine._scene.camera = this;
            this._applyRenderSettings();
        }
    },
    onDisable: function () {
        if (Engine._scene.camera === this) {
            Engine._scene.camera = null;
        }
        if (this._renderContext) {
            this._renderContext.camera = null;
        }
    },

    // other functions

    /**
     * Transforms position from viewport space into screen space.
     * @method viewportToScreen
     * @param {Vec2} position
     * @param {Vec2} [out] - optional, the receiving vector
     * @return {Vec2}
     */
    viewportToScreen: function (position, out) {
        if ( !this._renderContext ) {
            Fire.error("Camera not yet inited.");
            return;
        }
        out = this._renderContext.size.scale(position, out);
        return out;
    },

    /**
     * Transforms position from screen space into viewport space.
     * @method screenToViewport
     * @param {Vec2} position
     * @param {Vec2} [out] - optional, the receiving vector
     * @return {Vec2}
     */
    screenToViewport: function (position, out) {
        out = out || new Vec2();
        if ( !this._renderContext ) {
            Fire.error("Camera not yet inited.");
            return;
        }
        var size = this._renderContext.size;
        out.x = position.x / size.x;
        out.y = position.y / size.y;
        return out;
    },

    /**
     * Transforms position from viewport space into world space.
     * @method viewportToWorld
     * @param {Vec2} position
     * @param {Vec2} [out] - optional, the receiving vector
     * @return {Vec2}
     */
    viewportToWorld: function (position, out) {
        out = this.viewportToScreen(position, out);
        return this.screenToWorld(out, out);
    },

    /**
     * Transforms position from screen space into world space.
     * @method screenToWorld
     * @param {Vec2} position
     * @param {Vec2} [out] - optional, the receiving vector
     * @return {Vec2}
     */
    screenToWorld: function (position, out) {
        var halfScreenSize = (this._renderContext || Engine._renderContext).size.mul(0.5);
        var pivotToScreen = position.sub(halfScreenSize, halfScreenSize);
        pivotToScreen.y = -pivotToScreen.y; // 屏幕坐标的Y和世界坐标的Y朝向是相反的
        var mat = new Matrix23();
        var camPos = new Vec2();
        this._calculateTransform(mat, camPos);
        mat.invert();
        mat.tx = camPos.x;
        mat.ty = camPos.y;
        return mat.transformPoint(pivotToScreen, out);
    },

    /**
     * Transforms position from world space into screen space.
     * @method worldToScreen
     * @param {Vec2} position
     * @param {Vec2} [out] - optional, the receiving vector
     * @return {Vec2}
     */
    worldToScreen: function (position, out) {
        var mat = new Matrix23();
        var camPos = new Vec2();
        this._calculateTransform(mat, camPos);
        var toCamera = position.sub(camPos, camPos);
        out = mat.transformPoint(toCamera, out);
        var height = (this._renderContext || Engine._renderContext).size.y;
        out.y = height - out.y;
        return out;
    },

    /**
     * Transforms position from world space into viewport space.
     * @method worldToViewport
     * @param {Vec2} position
     * @param {Vec2} [out] - optional, the receiving vector
     * @return {Vec2}
     */
    worldToViewport: function (position, out) {
        out = this.worldToScreen(position, out);
        return this.screenToViewport(out, out);
    },

    _calculateTransform: function (out_matrix, out_worldPos) {
        // TODO: 等 fireball-x/dev#388 完成后去掉该保护代码
        if (!this._contentStrategyInst) {
            this._contentStrategyInst = Fire.Screen.ContentStrategy.fromType(this._contentStrategy);
        }
        var viewportInfo = this.viewportInfo;
        var scale = viewportInfo.scale;
        var viewport = viewportInfo.viewport;

        var tf = this.entity.transform;
        var mat = tf.getLocalToWorldMatrix();

        out_worldPos.x = mat.tx;
        out_worldPos.y = mat.ty;

        out_matrix.identity();
        out_matrix.tx = viewport.width * 0.5;
        out_matrix.ty = viewport.height * 0.5;
        out_matrix.a = scale.x;
        out_matrix.d = scale.y;
        out_matrix.rotate(mat.getRotation());
    },

    _applyRenderSettings: function () {
        // @ifdef EDITOR
        if (!this._renderContext) {
            Fire.error('No corresponding render context for camera ' + this.entity.name);
            return;
        }
        // @endif
        this._renderContext.background = this._background;
    }
});

Fire.addComponentMenu(Camera, 'Camera');
Fire.executeInEditMode(Camera);

//Object.defineProperty(Camera.prototype, 'scaleStrategyInst', {
//    get: function (value) {
//        if ( !this._cachedResolutionPolicy ) {
//            this._cachedResolutionPolicy = Fire.Screen.ResolutionPolicy.fromType(this._resolutionPolicy);
//        }
//        return this._cachedResolutionPolicy;
//    }
//});

Fire.Camera = Camera;
