var tmpMat23 = new Fire.Matrix23();

/**
 * Renders a sprite in the scene.
 * @class SpriteRenderer
 * @extends Renderer
 * @constructor
 */
var SpriteRenderer = Fire.Class({
    name: 'Fire.SpriteRenderer',
    extends: Renderer,
    constructor: function () {
        RenderContext.initRenderer(this);
    },

    properties: {
        _sprite: null,

        /**
         * The sprite to render.
         * @property sprite
         * @type {Sprite}
         * @default null
         */
        sprite: {
            get: function () {
                return this._sprite;
            },
            set: function (value) {
                this._sprite = value;
                if (this.isOnLoadCalled) {
                    Engine._renderContext.updateMaterial(this);
                }
            },
            type: Fire.Sprite
        },

        _color: Fire.Color.white,

        /**
         * !#en The rendering color.
         * !#zh Sprite 渲染的颜色，其中 alpha 为 1 时表示不透明，0.5 表示半透明，0 则全透明。
         * @property color
         * @type Color
         * @default Fire.Color.white
         */
        color: {
            get: function () {
                return this._color;
            },
            set: function (value) {
                this._color = value;
                if (this.isOnLoadCalled) {
                    Engine._renderContext.updateColor(this);
                }
            }
        },

        _useCustomSize: false,

        /**
         * !#en Indicates that this renderer uses custom width and height to render the sprite.
         * !#zh 是否使用自定义尺寸渲染。
         * - 为 true 时将忽略 sprite 的大小，使用 customWidth 和 customHeight 进行渲染。
         * - 为 false 则使用 sprite 原有的 width 和 height 进行渲染。
         *
         * @property useCustomSize
         * @type {boolean}
         * @default false
         */
        useCustomSize: {
            get: function () {
                return this._useCustomSize;
            },
            set: function (value) {
                this._useCustomSize = value;
            }
        },

        width_: {
            default: 100,
            visible: false
        },

        /**
         * The custom width of this renderer.
         *
         * @property customWidth
         * @type {number}
         */
        customWidth: {
            get: function () {
                return this.width_;
            },
            set: function (value) {
                this.width_ = value;
            },
            watch: {
                _useCustomSize: function (obj, propEL) {
                    propEL.disabled = !obj._useCustomSize;
                }
            }
        },

        /**
         * !#en Get the render width of this renderer.
         * !#zh 获取该 Renderer 的渲染宽度，如果 useCustomSize 为 true，获取到的是 custom width，否则是 sprite width。
         *
         * @property renderWidth
         * @type {number}
         * @readOnly
         */
        renderWidth: {
            get: function () {
                if (this._useCustomSize) {
                    return this.width_;
                }
                else {
                    return Fire.isValid(this._sprite) ? this._sprite.width : 0;
                }
            },
            visible: false
        },

        height_: {
            default: 100,
            visible: false
        },

        /**
         * The custom height of this renderer.
         *
         * @property height
         * @type {number}
         */
        customHeight: {
            get: function () {
                return this.height_;
            },
            set: function (value) {
                this.height_ = value;
            },
            watch: {
                _useCustomSize: function (obj, propEL) {
                    propEL.disabled = !obj._useCustomSize;
                }
            }
        },

        /**
         * !#en Get the render height of this renderer.
         * !#zh 获取该 Renderer 的渲染高度，如果 useCustomSize 为 true，获取到的是 custom height，否则是 sprite height。
         *
         * @property height
         * @type {number}
         * @readOnly
         */
        renderHeight: {
            get: function () {
                if (this._useCustomSize) {
                    return this.height_;
                }
                else {
                    return Fire.isValid(this._sprite) ? this._sprite.height : 0;
                }
            },
            visible: false
        }
    },

    // built-in functions

    onLoad: function () {
        Engine._renderContext.addSprite(this);
    },
    onEnable: function () {
        Engine._renderContext.show(this, true);
    },
    onDisable: function () {
        Engine._renderContext.show(this, false);
    },

    getWorldSize: function () {
        return new Fire.Vec2(this.renderWidth, this.renderHeight);
    },


    onPreRender: function () {
        this.getSelfMatrix(tmpMat23);
        if (this._sprite) {
            // calculate render matrix
            //   scale
            tmpMat23.a = this.renderWidth / this._sprite.width;
            tmpMat23.d = this.renderHeight / this._sprite.height;
            //   rotate cw
            if (this._sprite.rotated) {
                tmpMat23.b = tmpMat23.d;
                tmpMat23.c = -tmpMat23.a;
                tmpMat23.a = 0;
                tmpMat23.d = 0;
                tmpMat23.ty -= this.renderHeight;
            }
        }
        tmpMat23.prepend(this.transform._worldTransform);
        Engine._curRenderContext.updateTransform(this, tmpMat23);
    },
    onDestroy: function () {
        Engine._renderContext.remove(this);
    },

    getSelfMatrix: function (out) {
        var w = this.renderWidth;
        var h = this.renderHeight;

        var pivotX = 0.5;
        var pivotY = 0.5;

        //var rotated = false;
        if (Fire.isValid(this._sprite)) {
            //rotated = this._sprite.rotated;
            pivotX = this._sprite.pivot.x;
            pivotY = this._sprite.pivot.y;
        }

        //if ( !rotated ) {
            out.a = 1;
            out.b = 0;
            out.c = 0;
            out.d = 1;
            out.tx = - pivotX * w;
            out.ty = (1.0 - pivotY) * h;
        //}
        //else {
        //    // CCW
        //    //out.a = 0;
        //    //out.b = scaleY;
        //    //out.c = -scaleX;
        //    //out.d = 0;
        //    //out.tx = - (pivotY - 1.0) * w;
        //    //out.ty = - pivotX * h;
        //
        //    // CW
        //    out.a = 0;
        //    out.b = -scaleY;
        //    out.c = scaleX;
        //    out.d = 0;
        //    out.tx = (1.0 - pivotX) * w;
        //    out.ty = (1.0 - pivotY) * h;
        //}
    }
});

Fire.SpriteRenderer = SpriteRenderer;

Fire.addComponentMenu(SpriteRenderer, 'Sprite Renderer');
Fire.executeInEditMode(SpriteRenderer);

JS.getset(SpriteRenderer.prototype, 'customSize_',
    function () {
        Fire.warn("'SpriteRenderer.customSize_' is deprecated, use _useCustomSize instead ; )");
        return this._useCustomSize;
    },
    function (value) {
        Fire.warn("'SpriteRenderer.customSize_' is deprecated, use _useCustomSize instead ; )");
        this._useCustomSize = value;
    }
);
JS.getset(SpriteRenderer.prototype, 'customSize',
    function () {
        Fire.warn("'SpriteRenderer.customSize' is deprecated, use useCustomSize instead ; )");
        return this.useCustomSize;
    },
    function (value) {
        Fire.warn("'SpriteRenderer.customSize' is deprecated, use useCustomSize instead ; )");
        this.useCustomSize = value;
    }
);
JS.getset(SpriteRenderer.prototype, 'width',
    function () {
        Fire.warn("The getter of 'SpriteRenderer.width' is deprecated, use renderWidth instead ; )");
        return this.renderWidth;
    },
    function (value) {
        Fire.warn("The setter 'SpriteRenderer.width' is deprecated, use customWidth instead ; )");
        this.customWidth = value;
    }
);
JS.getset(SpriteRenderer.prototype, 'height',
    function () {
        Fire.warn("The getter of 'SpriteRenderer.height' is deprecated, use renderHeight instead ; )");
        return this.renderHeight;
    },
    function (value) {
        Fire.warn("The setter 'SpriteRenderer.height' is deprecated, use customHeight instead ; )");
        this.customHeight = value;
    }
);
