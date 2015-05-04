var Text = (function () {
    /**
     * @class FontType
     * @static
     */
    var FontType = Fire.defineEnum({
        /**
         * @property Arial
         * @type {number}
         */
        Arial: -1,
        /**
         * @property Custom
         * @type {number}
         */
        Custom: -1
    });

    var tempMatrix = new Fire.Matrix23();

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
                default: FontType.Arial,
                type: FontType
            },
            fontType: {
                get: function () {
                    return this._fontType;
                },
                set: function (value) {
                    this._fontType = value;
                    Engine._renderContext.setTextStyle(this);
                },
                type: FontType
            },
            _customFontType: "Arial",
            customFontType:{
                get: function () {
                    return this._customFontType;
                },
                set: function (value) {
                    this._customFontType = value;
                    Engine._renderContext.setTextStyle(this);
                },
                watch: {
                    _fontType: function (obj, propEL) {
                        propEL.disabled = obj._fontType !== FontType.Custom;
                    }
                }
            },
            // 文字内容
            _text: 'text',
            //
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
            _align: Fire.TextAlign.left,
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
            _anchor: Fire.TextAnchor.midCenter,
            anchor: {
                get: function() {
                    return this._anchor;
                },
                set: function(value){
                    if (value !== this._anchor) {
                        this._anchor = value;
                    }
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
        getSelfMatrix: function (out) {
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
        },
        onPreRender: function () {
            this.getSelfMatrix(tempMatrix);
            tempMatrix.prepend(this.transform._worldTransform);
            Engine._curRenderContext.updateTextTransform(this, tempMatrix);
        }
    });

    Text.FontType = FontType;

    //-- 增加 Text 到 组件菜单上
    Fire.addComponentMenu(Text, 'Text');
    Fire.executeInEditMode(Text);

    return Text;
})();

Fire.Text = Text;
