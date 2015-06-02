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

    /**
     * The Input Field renderer component.
     * @class InputField
     * @extends Renderer
     */
    var InputField = Fire.Class({
        // 名字
        name: "Fire.InputField",
        // 继承
        extends: Renderer,
        // 属性
        properties: {
            _background: {
                default: null
            },
            /**
             * The background of the inputField.
             * @property background
             * @type {SpriteRenderer}
             * @default null
             */
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
            /**
             * The font type of the input text.
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
                    Engine._renderContext.setFontName(this);
                },
                type: Fire.FontType
            },
            _customFontType: "Arial",
            /**
             * The custom font type of the input text.
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
            /**
             * The font flag Type of the input text.
             * @property fontFlagType
             * @type {FontFlagType}
             * @default FontFlagType.Text
             */
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
            _placeHolder: 'Enter text...',
            placeHolder: {
                get: function () {
                    return this._placeHolder;
                },
                set: function (value) {
                    this._placeHolder = value;
                    Engine._renderContext.setPlaceHolder(this);
                }
            },

            /**
             * The text of input field.
             * @property text
             * @type {string}
             * @default "Enter text..."
             */
            text: {
                get: function () {
                    return Engine._renderContext.getInputText(this);
                },
                set: function (value) {
                    Engine._renderContext.setInputText(this, value);
                },
                multiline: true
            },
            _size: 20,
            /**
             * The size of input text.
             * @property size
             * @type {number}
             * @default 20
             */
            size: {
                get: function () {
                    return this._size;
                },
                set: function (value) {
                    this._size = value;
                    Engine._renderContext.setFontSize(this);
                }
            },
            _maxLength: 50,
            /**
             * The maxLength of input text.
             * @property maxLength
             * @type {number}
             * @default 50
             */
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
            /**
             * The color of input text.
             * @property color
             * @type {Color}
             * @default Fire.Color.black
             */
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
            _anchor: Fire.TextAnchor.MiddleCenter,
            /**
             * The anchor point of the input field.
             * @property anchor
             * @type {Fire.TextAnchor}
             * @default Fire.TextAnchor.MiddleCenter
             */
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
        getWorldSize: function () {
            return Engine._renderContext.getTextSize(this);
        },
        onPreRender: function () {
            this.getSelfMatrix(tempMatrix);
            tempMatrix.prepend(this.transform._worldTransform);
            Engine._curRenderContext.updateInputFieldTransform(this, tempMatrix);
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

    //-- 增加 TextInput 到 组件菜单上
    Fire.addComponentMenu(InputField, 'InputField');

    return InputField;
})();

Fire.InputField = InputField;