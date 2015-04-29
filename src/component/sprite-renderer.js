var SpriteRenderer = (function () {

    /**
     * Renders a sprite in the scene.
     * @class SpriteRenderer
     * @extends Renderer
     * @constructor
     */
    var SpriteRenderer = Fire.extend('Fire.SpriteRenderer', Renderer, function () {
        RenderContext.initRenderer(this);
        this._hasRenderObj = false;
    });
    Fire.addComponentMenu(SpriteRenderer, 'SpriteRenderer');
    Fire.executeInEditMode(SpriteRenderer);

    SpriteRenderer.prop('_sprite', null, Fire.HideInInspector);
    /**
     * The sprite to render.
     * @property sprite
     * @type {Sprite}
     * @default null
     */
    SpriteRenderer.getset('sprite',
        function () {
            return this._sprite;
        },
        function (value) {
            this._sprite = value;
            if (this._hasRenderObj) {
                Engine._renderContext.updateMaterial(this);
            }
        },
        Fire.ObjectType(Fire.Sprite)
    );

    SpriteRenderer.prop('_color', new Fire.Color(1, 1, 1, 1), Fire.HideInInspector);
    /**
     * !#en The rendering color.
     * !#zh Sprite 渲染的颜色，其中 alpha 为 1 时表示不透明，0.5 表示半透明，0 则全透明。
     * @property color
     * @type Color
     * @default new Color(1, 1, 1, 1)
     */
    SpriteRenderer.getset('color',
        function () {
            return this._color;
        },
        function (value) {
            this._color = value;
            if (this._hasRenderObj) {
                Engine._renderContext.updateColor(this);
            }
        }
    );

    SpriteRenderer.prop('customSize_', false, Fire.HideInInspector);

    /**
     * !#en Indicates that this renderer uses custom width and height to render the sprite.
     * !#zh 是否使用自定义尺寸渲染。
     * - 为 true 时将忽略 sprite 的大小，使用 renderer 的 width 和 height 进行渲染。
     * - 为 false 则使用 sprite 原有的 width 和 height 进行渲染。
     *
     * @property customSize
     * @type {boolean}
     * @default false
     */
    SpriteRenderer.getset('customSize',
        function () {
            return this.customSize_;
        },
        function (value) {
            this.customSize_ = value;
        }
    );

    SpriteRenderer.prop('width_', 100, Fire.DisplayName('Width'),
                        Fire.Watch( 'customSize_', function ( obj, propEL ) {
                            propEL.disabled = !obj.customSize_;
                        } ));
    /**
     * !#en The custom width of this renderer.
     * !#zh 获取该 Renderer 的渲染宽度，如果使用的是 customSize，获取到的是 custom width，否则是 sprite width。
     * 设置这个值时，会修改 custom width。
     * @property width
     * @type {number}
     * @beta
     */
    SpriteRenderer.getset('width',
        function () {
            if ( !this.customSize_ ) {
                return Fire.isValid(this._sprite) ? this._sprite.width : 0;
            }
            else {
                return this.width_;
            }
        },
        function (value) {
            this.width_ = value;
        },
        Fire.HideInInspector
    );

    SpriteRenderer.prop('height_', 100, Fire.DisplayName('Height'),
                        Fire.Watch( 'customSize_', function ( obj, propEL) {
                            propEL.disabled = !obj.customSize;
                        } ));

    /**
     * !#en The custom height of this renderer.
     * !#zh 获取该 Renderer 的渲染高度，如果使用的是 customSize，获取到的是 custom height，否则是 sprite height。
     * 设置这个值时，会修改 custom height。
     * @property height
     * @type {number}
     * @beta
     */
    SpriteRenderer.getset('height',
        function () {
            if ( !this.customSize_ ) {
                return Fire.isValid(this._sprite) ? this._sprite.height : 0;
            }
            else {
                return this.height_;
            }
        },
        function (value) {
            this.height_ = value;
        },
        Fire.HideInInspector
    );

    // built-in functions

    SpriteRenderer.prototype.onLoad = function () {
        Engine._renderContext.addSprite(this);
        this._hasRenderObj = true;
    };
    SpriteRenderer.prototype.onEnable = function () {
        Engine._renderContext.show(this, true);
    };
    SpriteRenderer.prototype.onDisable = function () {
        Engine._renderContext.show(this, false);
    };

    SpriteRenderer.prototype.getWorldSize = function () {
        return new Fire.Vec2(this.width, this.height);
    };

    var tempMatrix = new Fire.Matrix23();

    SpriteRenderer.prototype.onPreRender = function () {
        this.getSelfMatrix(tempMatrix);
        if (this._sprite) {
            // calculate render matrix
            //   scale
            tempMatrix.a = this.width / this._sprite.width;
            tempMatrix.d = this.height / this._sprite.height;
            //   rotate cw
            if (this._sprite.rotated) {
                tempMatrix.b = tempMatrix.d;
                tempMatrix.c = -tempMatrix.a;
                tempMatrix.a = 0;
                tempMatrix.d = 0;
                tempMatrix.ty -= this.height;
            }
        }
        tempMatrix.prepend(this.transform._worldTransform);
        Engine._curRenderContext.updateTransform(this, tempMatrix);
    };
    SpriteRenderer.prototype.onDestroy = function () {
        Engine._renderContext.remove(this);
    };

    SpriteRenderer.prototype.getSelfMatrix = function (out) {
        var w = this.width;
        var h = this.height;

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
    };

    return SpriteRenderer;
})();

Fire.SpriteRenderer = SpriteRenderer;
