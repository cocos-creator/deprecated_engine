var Text = (function () {

    var tempMatrix = new Fire.Matrix23();

    /**
     * The text renderer component.
     * @class Text
     * @extends Renderer
     * @constructor
     */
    var Text = Fire.Class({
        // 名字
        name: "Fire.Text",
        // 继承
        extends: Renderer,
        // 构造函数
        constructor: function () {
            RenderContext.initRenderer(this);
        },
        // 属性
        properties: {
            // 字体类型
            _fontType: {
                default: Fire.FontType.Arial,
                type: Fire.FontType
            },
            /**
             * The font type of the text.
             * @property fontType
             * @type {FontType}
             * @default FontType.Arial
             */
            fontType: {
                get: function () {
                    return this._fontType;
                },
                set: function (value) {
                    this._fontType = value;
                    Engine._renderContext.setTextStyle(this);
                },
                type: Fire.FontType
            },
            _customFontType: "Arial",
            /**
             * The custom font type of the text.
             * @property customFontType
             * @type {string}
             * @default "Arial"
             */
            customFontType:{
                get: function () {
                    return this._customFontType;
                },
                set: function (value) {
                    this._customFontType = value;
                    Engine._renderContext.setTextStyle(this);
                },
                watch: {
                    '_fontType': function (obj, propEL) {
                        propEL.disabled = obj._fontType !== Fire.FontType.Custom;
                    }
                }
            },
            // 文字内容
            _text: 'text',
            /**
             * The text of text.
             * @property text
             * @type {string}
             * @default "Enter text..."
             */
            text: {
                get: function () {
                    return this._text;
                },
                set: function (value) {
                    this._text = value;
                    Engine._renderContext.setTextContent(this, this._text);
                },
                multiline: true
            },
            // 字体大小
            _size: 30,
            /**
             * The size of text.
             * @property size
             * @type {number}
             * @default 30
             */
            size: {
                get: function() {
                    return this._size;
                },
                set: function(value) {
                    if (value !== this._size && value > 0) {
                        this._size = value;
                        Engine._renderContext.setTextStyle(this);
                    }
                }
            },
            // 字体颜色
            _color: Fire.Color.white,
            /**
             * The color of text.
             * @property color
             * @type {Color}
             * @default Fire.Color.white
             */
            color: {
                get: function() {
                    return this._color;
                },
                set: function(value) {
                    this._color = value;
                    Engine._renderContext.setTextStyle(this);
                }
            },
            // 字体对齐方式
            _align: Fire.TextAlign.Left,
            /**
             * How lines of text are aligned (left, right, center).
             * @property align
             * @type {Fire.TextAlign}
             * @default Fire.TextAlign.left
             */
            align: {
                get: function() {
                    return this._align;
                },
                set: function(value) {
                    this._align = value;
                    Engine._renderContext.setTextStyle(this);
                },
                type: Fire.TextAlign
            },
            // 字体锚点
            _anchor: Fire.TextAnchor.MidCenter,
            /**
             * The anchor point of the text.
             * @property anchor
             * @type {Fire.TextAnchor}
             * @default Fire.TextAnchor.midCenter
             */
            anchor: {
                get: function() {
                    return this._anchor;
                },
                set: function(value) {
                    this._anchor = value;
                },
                type: Fire.TextAnchor
            }
        },
        onLoad: function () {
            Engine._renderContext.addText(this);
        },
        onEnable: function () {
            Engine._renderContext.show(this, true);
        },
        onDisable: function () {
            Engine._renderContext.show(this, false);
        },
        onDestroy: function () {
            Engine._renderContext.remove(this);
        },
        getWorldSize: function () {
            return Engine._renderContext.getTextSize(this);
        },
        onPreRender: function () {
            this.getSelfMatrix(tempMatrix);
            tempMatrix.prepend(this.transform._worldTransform);
            Engine._curRenderContext.updateTextTransform(this, tempMatrix);
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
                case Fire.TextAnchor.MidLeft:
                    anchorOffsetY = h * 0.5;
                    break;
                case Fire.TextAnchor.MidCenter:
                    anchorOffsetX = w * -0.5;
                    anchorOffsetY = h * 0.5;
                    break;
                case Fire.TextAnchor.MidRight:
                    anchorOffsetX = -w;
                    anchorOffsetY = h * 0.5;
                    break;
                case Fire.TextAnchor.BotLeft:
                    anchorOffsetY = h;
                    break;
                case Fire.TextAnchor.BotCenter:
                    anchorOffsetX = w * -0.5;
                    anchorOffsetY = h;
                    break;
                case Fire.TextAnchor.BotRight:
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

    //-- 增加 Text 到 组件菜单上
    Fire.addComponentMenu(Text, 'Text');
    Fire.executeInEditMode(Text);

    return Text;
})();

Fire.Text = Text;
