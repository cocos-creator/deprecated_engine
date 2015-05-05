var InputField = (function () {

    /**
     * @class FontFlagType
     * @static
     */
    var FontFlagType = Fire.defineEnum({
        /**
         * @property Password
         * @type {number}
         */
        Password: -1,
        /**
         * @property Text
         * @type {number}
         */
        Text: -1
    });

    var tempMatrix = new Fire.Matrix23();

    var InputField = Fire.Class({
        // 名字
        name: "Fire.InputField",
        // 继承
        extends: Renderer,
        // 构造函数
        constructor: function () {
        },
        // 属性
        properties: {
            _background: {
                default: null,
                type: Fire.SpriteRenderer
            },
            background: {
                get: function () {
                    return this._background;
                },
                set: function (value) {
                    this._background = value;
                },
                type: Fire.SpriteRenderer
            },
            // 字体类型
            _fontType: {
                default: Fire.FontType.Arial,
                type: Fire.FontType
            },
            fontType: {
                get: function () {
                    return this._fontType;
                },
                set: function (value) {
                    this._fontType = value;
                    Engine._renderContext.setFontName(this);
                },
                type: Fire.FontType
            },
            _customFontType: "Arial",
            customFontType:{
                get: function () {
                    return this._customFontType;
                },
                set: function (value) {
                    this._customFontType = value;
                    Engine._renderContext.setFontName(this);
                },
                watch: {
                    '_fontType': function (obj, propEL) {
                        propEL.disabled = obj._fontType !== Fire.FontType.Custom;
                    }
                }
            },
            _fontFlagType: {
                default: FontFlagType.Text,
                type: FontFlagType
            },
            fontFlagType: {
                get: function () {
                    return this._fontFlagType;
                },
                set: function (value) {
                    this._fontFlagType = value;
                    Engine._renderContext.setInputFlag(this);
                },
                type: FontFlagType
            },
            _text: 'Enter text...',
            text: {
                get: function () {
                    var contentText = Engine._renderContext.getInputText(this);
                    return contentText ? contentText : this._text;
                },
                set: function (value) {
                    this._text = value;
                    Engine._renderContext.setInputText(this);
                },
                multiline: true
            },
            _size: 20,
            size: {
                get: function () {
                    return this._size;
                },
                set: function (value) {
                    this._size = value;
                    Engine._renderContext.setFontSize(this);
                }
            },
            _maxLength: 10,
            maxLength:{
                get: function () {
                    return this._maxLength;
                },
                set: function (value) {
                    this._maxLength = value;
                    Engine._renderContext.setMaxLength(this);
                }
            },
            _color: Fire.Color.black,
            color: {
                get: function() {
                    return this._color;
                },
                set: function(value) {
                    this._color = value;
                    Engine._renderContext.setTextColor(this);
                }
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
            Engine._renderContext.initInputField(this);
        },
        onStart: function () {
            this._background = this.entity.parent;
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
            Engine._curRenderContext.updateInputFieldTransform(this, tempMatrix);
        }
    });

    //-- 增加 TextInput 到 组件菜单上
    Fire.addComponentMenu(InputField, 'InputField');
    Fire.executeInEditMode(InputField);

    return InputField;
})();

Fire.InputField = InputField;