var Destroying = Fire._ObjectFlags.Destroying;
var DontDestroy = Fire._ObjectFlags.DontDestroy;
var Hide = Fire._ObjectFlags.Hide;
var HideInGame = Fire._ObjectFlags.HideInGame;
var HideInEditor = Fire._ObjectFlags.HideInEditor;


/**
 * !#zh 内容适配策略负责缩放摄像机画面以适应画布(Canvas)。
 * @class ContentStrategyType
 * @static
 */
var ContentStrategyType = Fire.defineEnum({

    /**
     * !#zh 不缩放内容，所有元素以原始大小显示在 Canvas 上。
     *
     * @property NoScale
     * @type number
     * @readOnly
     */
    NoScale: -1,

    ///**
    // * !#zh FixedWidth 模式会横向放大游戏世界以适应 Canvas 的宽度，纵向按原始宽高比放大。结果有可能导致放大（上下被裁剪），也有可能导致缩小（上下露出黑边）。
    // *
    // * @property FixedWidth
    // * @type number
    // * @readOnly
    // */
    //FixedWidth: -1,

    /**
     * !#en The application takes the height of the design resolution size and modifies the width of the internal canvas,
     * so that it fits the aspect ratio of the device and no distortion will occur,
     * however you must make sure your application works on different aspect ratios
     *
     * !#zh FixedHeight 模式会纵向放大游戏世界以适应 Canvas 的高度，横向按原始宽高比放大。结果有可能导致放大（左右被裁剪），也有可能导致缩小（左右露出黑边）。这是目前最推荐的适配方案。
     *
     * @property FixedHeight
     * @type number
     * @readOnly
     */
    FixedHeight: -1
});
Fire.ContentStrategyType = ContentStrategyType;

// @ifdef DEV
var __TESTONLY__ = {};
Fire.__TESTONLY__ = __TESTONLY__;
// @endif
