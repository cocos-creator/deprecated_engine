
var BitmapText = (function () {

    var tempMatrix = new Fire.Matrix23();

    /**
     * The bitmap font renderer component.
     * @class BitmapText
     * @extends Renderer
     * @constructor
     */
    var BitmapText = Fire.Class({
        name: "Fire.BitmapText",

        extends: Renderer,

        properties: {
            _bitmapFont: null,

            /**
             * The font to render.
             * @property bitmapFont
             * @type {BitmapFont}
             * @default null
             */
            bitmapFont: {
                get: function () {
                    return this._bitmapFont;
                },
                set: function (value) {
                    this._bitmapFont = value;
                    Engine._renderContext.updateBitmapFont(this);
                },
                type: Fire.BitmapFont
            },

            _text: 'Text',

            /**
             * The text to render.
             * @property text
             * @type {string}
             * @default ""
             */
            text: {
                get: function () {
                    return this._text;
                },
                set: function (value) {
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
                multiline: true
            },

            _color: Fire.Color.white,

            /**
             * The color of the text.
             * @property color
             * @type {Color}
             * @default Fire.Color.white
             */
            color: {
                get: function () {
                    return this._color;
                },
                set: function (value) {
                    this._color = value;
                    Engine._renderContext.updateColor(this, value);
                }
            },

            _anchor: Fire.TextAnchor.MiddleCenter,

            /**
             * The anchor point of the text.
             * @property anchor
             * @type {Fire.TextAnchor}
             * @default Fire.TextAnchor.MiddleCenter
             */
            anchor: {
                get: function () {
                    return this._anchor;
                },
                set: function (value) {
                    if (this._anchor !== value) {
                        this._anchor = value;
                    }
                },
                type: Fire.TextAnchor
            },

            _align: Fire.TextAlign.Left,

            /**
             * How lines of text are aligned (left, right, center).
             * @property align
             * @type {Fire.TextAlign}
             * @default Fire.TextAlign.left
             */
            align: {
                get: function () {
                    return this._align;
                },
                set: function (value) {
                    if (this._align !== value) {
                        this._align = value;
                        Engine._renderContext.setAlign(this, value);
                    }
                },
                type: Fire.TextAlign
            }
        },
        onLoad: function () {
            Engine._renderContext.addBitmapText(this);
        },
        getWorldSize: function () {
            return Engine._renderContext.getTextSize(this);
        },
        onPreRender:  function () {
            this.getSelfMatrix(tempMatrix);
            tempMatrix.prepend(this.transform._worldTransform);
            Engine._curRenderContext.updateBitmapTextTransform(this, tempMatrix);
        },
        getSelfMatrix: function (out) {
            var textSize = Engine._renderContext.getTextSize(this);
            var w = textSize.x;
            var h = textSize.y;

            var anchorOffsetX = 0;
            var anchorOffsetY = 0;

            switch (this._anchor) {
                case Fire.TextAnchor.TopLeft:
                    break;
                case Fire.TextAnchor.TopCenter:
                    anchorOffsetX = w * -0.5;
                    break;
                case Fire.TextAnchor.TopRight:
                    anchorOffsetX = -w;
                    break;
                case Fire.TextAnchor.MiddleLeft:
                    anchorOffsetY = h * 0.5;
                    break;
                case Fire.TextAnchor.MiddleCenter:
                    anchorOffsetX = w * -0.5;
                    anchorOffsetY = h * 0.5;
                    break;
                case Fire.TextAnchor.MiddleRight:
                    anchorOffsetX = -w;
                    anchorOffsetY = h * 0.5;
                    break;
                case Fire.TextAnchor.BottomLeft:
                    anchorOffsetY = h;
                    break;
                case Fire.TextAnchor.BottomCenter:
                    anchorOffsetX = w * -0.5;
                    anchorOffsetY = h;
                    break;
                case Fire.TextAnchor.BottomRight:
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
        }

    });

    //-- 增加 Bitmap Text 到 组件菜单上
    Fire.addComponentMenu(BitmapText, 'Bitmap Text');

    return BitmapText;
})();

Fire.BitmapText = BitmapText;
