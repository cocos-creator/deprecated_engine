
var BitmapText = (function () {

    /**
     * The bitmap font renderer component.
     * @class BitmapText
     * @extends Renderer
     * @constructor
     */
    var BitmapText = Fire.extend("Fire.BitmapText", Renderer, function () {
        RenderContext.initRenderer(this);
    });

    //-- 增加 Bitmap Text 到 组件菜单上
    Fire.addComponentMenu(BitmapText, 'BitmapText');
    Fire.executeInEditMode(BitmapText);

    BitmapText.prop('_bitmapFont', null, Fire.HideInInspector);
    /**
     * The font to render.
     * @property bitmapFont
     * @type {BitmapFont}
     * @default null
     */
    BitmapText.getset('bitmapFont',
        function () {
            return this._bitmapFont;
        },
        function (value) {
            this._bitmapFont = value;
            Engine._renderContext.updateBitmapFont(this);
        },
        Fire.ObjectType(Fire.BitmapFont)
    );

    BitmapText.prop('_text', 'Text', Fire.HideInInspector);

    /**
     * The text to render.
     * @property text
     * @type {string}
     * @default ""
     */
    BitmapText.getset('text',
        function () {
            return this._text;
        },
        function (value) {
            if (this._text !== value) {
                if (typeof value === 'string') {
                    this._text = value;
                }
                else {
                    this._text = '' + value;
                }
                Engine._renderContext.setText(this, this._text);
            }
        },
        Fire.MultiText
    );

    BitmapText.prop('_anchor', Fire.TextAnchor.midCenter, Fire.HideInInspector);


    /**
     * The color of the text.
     * @property color
     * @type {Color}
     * @default Fire.Color.white
     */
    BitmapText.getset('color',
        function () {
            return this._color;
        },
        function (value) {
            this._color = value;
            Engine._renderContext.updateColor(this, value);
        }
    );

    BitmapText.prop('_color', Fire.Color.white, Fire.HideInInspector);

    /**
     * The anchor point of the text.
     * @property anchor
     * @type {BitmapText.TextAnchor}
     * @default BitmapText.TextAnchor.midCenter
     */
    BitmapText.getset('anchor',
        function () {
            return this._anchor;
        },
        function (value) {
            if (this._anchor !== value) {
                this._anchor = value;
            }
        },
        Fire.Enum(Fire.TextAnchor)
    );

    BitmapText.prop('_align', Fire.TextAlign.left, Fire.HideInInspector);

    /**
     * How lines of text are aligned (left, right, center).
     * @property align
     * @type {BitmapText.TextAlign}
     * @default BitmapText.TextAlign.left
     */
    BitmapText.getset('align',
        function () {
            return this._align;
        },
        function (value) {
            if (this._align !== value) {
                this._align = value;
                Engine._renderContext.setAlign(this, value);
            }
        },
        Fire.Enum(Fire.TextAlign)
    );

    BitmapText.prototype.onLoad = function () {
        Engine._renderContext.addBitmapText(this);
    };

    BitmapText.prototype.onEnable = function () {
        Engine._renderContext.show(this, true);
    };

    BitmapText.prototype.onDisable = function () {
        Engine._renderContext.show(this, false);
    };

    BitmapText.prototype.onDestroy = function () {
        Engine._renderContext.remove(this);
    };

    BitmapText.prototype.getWorldSize = function () {
        return Engine._renderContext.getTextSize(this);
    };

    var tempMatrix = new Fire.Matrix23();

    BitmapText.prototype.onPreRender = function () {
        this.getSelfMatrix(tempMatrix);
        tempMatrix.prepend(this.transform._worldTransform);
        Engine._curRenderContext.updateBitmapTextTransform(this, tempMatrix);
    };

    BitmapText.prototype.getSelfMatrix = function (out) {
        var textSize = Engine._renderContext.getTextSize(this);
        var w = textSize.x;
        var h = textSize.y;

        var anchorOffsetX = 0;
        var anchorOffsetY = 0;

        switch (this._anchor) {
            case Fire.TextAnchor.topLeft:
                break;
            case Fire.TextAnchor.topCenter:
                anchorOffsetX = w * -0.5;
                break;
            case Fire.TextAnchor.topRight:
                anchorOffsetX = -w;
                break;
            case Fire.TextAnchor.midLeft:
                anchorOffsetY = h * 0.5;
                break;
            case Fire.TextAnchor.midCenter:
                anchorOffsetX = w * -0.5;
                anchorOffsetY = h * 0.5;
                break;
            case Fire.TextAnchor.midRight:
                anchorOffsetX = -w;
                anchorOffsetY = h * 0.5;
                break;
            case Fire.TextAnchor.botLeft:
                anchorOffsetY = h;
                break;
            case Fire.TextAnchor.botCenter:
                anchorOffsetX = w * -0.5;
                anchorOffsetY = h;
                break;
            case Fire.TextAnchor.botRight:
                anchorOffsetX = -w;
                anchorOffsetY = h;
                break;
            default:
                break;
        }
        out.a = 1;
        out.b = 0;
        out.c = 0;
        out.d = 1;
        out.tx = anchorOffsetX;
        out.ty = anchorOffsetY;
    };

    return BitmapText;
})();

Fire.BitmapText = BitmapText;
