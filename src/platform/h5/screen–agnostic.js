
/////////////////////////////////////////////////////////////////////////////////////////
//
///**
// * ResolutionPolicy class is the root strategy class of scale strategy.
// */
//function ResolutionPolicy (containerStrategy, contentStrategy) {
//    this._containerStrategy = containerStrategy;
//    this._contentStrategy = contentStrategy;
//}
//
//ResolutionPolicy.prototype.init = function () {
//    this._containerStrategy.init();
//    this._contentStrategy.init();
//};
//
///**
// * Function to apply this resolution policy.
// * The return value is {scale: {Fire.Vec2}, viewport: {Fire.Rect}}.
// * @param {Fire.Vec2} designedResolution - The user defined design resolution
// * @returns {object} An object contains the scale X/Y values and the viewport rect
// */
//ResolutionPolicy.prototype.apply = function (designedResolution) {
//    this._containerStrategy.apply(designedResolution);
//    return this._contentStrategy.apply(designedResolution);
//};
//
//ResolutionPolicy._registered = {};
//
///**
// * @param {Fire.ResolutionPolicyType} type
// * @returns {Fire.ResolutionPolicy} the instance of ResolutionPolicy
// */
//ResolutionPolicy.fromType = function (type) {
//    return this._registered[type];
//};
//
///**
// * @param {Fire.ResolutionPolicyType} type
// * @param instance
// */
//ResolutionPolicy.register = function (type, instance) {
//    this._registered[type] = instance;
//};
//
//Fire.Screen.ResolutionPolicy = ResolutionPolicy;

///////////////////////////////////////////////////////////////////////////////////////



///////////////////////////////////////////////////////////////////////////////////////

/**
 * ContainerStrategy class is the root strategy class of container's scale strategy,
 * it controls the behavior of how to scale the container and canvas.
 */
function ContainerStrategy () {}

ContainerStrategy.prototype.setupContainer = function (size) {
    var canvas = Fire.Engine._renderContext.canvas;
    var container = Fire.Screen._container;

    // Setup container
    container.style.width = canvas.style.width = size.x + 'px';
    container.style.height = canvas.style.height = size.y + 'py';

    // Setup canvas
    var devicePixelRatio = Fire.Screen.devicePixelRatio;
    Fire.Screen.size = size.mul(devicePixelRatio);  // enable retina display

    if (Fire.isMobile) {
        var body = document.body;
        var style;
        if (body && (style = body.style)) {
            ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
             'borderTop',  'borderRight',  'borderBottom',  'borderLeft',
             'marginTop',  'marginRight',  'marginBottom',  'marginLeft']
            .forEach(function (key) {
                style[key] = style[key] || '0px';
            });
        }
    }
};

Fire.Screen.ContainerStrategy = ContainerStrategy;

///////////////////////////////////////////////////////////////////////////////////////

/**
 * ContentStrategy class is the root strategy class of content's scale strategy,
 * it controls the behavior of how to scale the scene and setup the viewport for the game
 */
function ContentStrategy () {}

/**
 * Function to apply this strategy
 * The return value is {scale: {Fire.Vec2}, viewport: {Fire.Rect}},
 * @param {Fire.Vec2} designedResolution
 * @return {object} scaleAndViewportRect
 */
ContentStrategy.prototype.apply = function (designedResolution) {
};

ContentStrategy.prototype.buildResult = function (container, content, scale) {
    // Makes content fit better the canvas
    if (Math.abs(container.x - content.x) < 2) {
        content.x = container.x;
    }
    if (Math.abs(container.y - content.y) < 2) {
        content.y = container.y;
    }
    var viewport = new Fire.Rect(Math.round((container.x - content.x) / 2),
                                 Math.round((container.y - content.y) / 2),
                                 content.x,
                                 content.y);
    return {
        scale: scale,
        viewport: viewport
    };
};

//ContentStrategy.prototype.setup = function (w, h, styleW, styleH, left, top) {
//    //_stageWidth = Math.round(w);
//    //_stageHeight = Math.round(h);
//    var container = Fire.Scene._container;
//    container.style.width = styleW + "px";
//    container.style.height = styleH + "px";
//    container.style.top = top + "px";
//};

ContentStrategy.prototype.getContainerSize = function () {
    var container = Fire.Scene._container;
    return Fire.v2(container.clientWidth, container.clientHeight);
};

Fire.Screen.ContentStrategy = ContentStrategy;

///////////////////////////////////////////////////////////////////////////////////////

(function () {

// Container scale strategies

    function EqualToFrame () {
        ContainerStrategy.call(this);
    }
    Fire.JS.extend(EqualToFrame, ContainerStrategy);

    EqualToFrame.prototype.apply = function () {
        var frameSize = Fire.Screen._frameSize;
        this.setupContainer(frameSize);
    };

    /**
     * Strategy that makes the container's size equals to the frame's size
     * @type {EqualToFrame}
     */
    ContainerStrategy.EqualToFrame = new EqualToFrame();

// Content scale strategies

    function NoScale () {
        ContentStrategy.call(this);
    }
    Fire.JS.extend(NoScale, ContentStrategy);

    NoScale.prototype.apply = function (designedResolution, viewportSize) {
        return this.buildResult(viewportSize, viewportSize, Vec2.one);
    };

    /**
     * Strategy to scale the content's height to container's height and proportionally scale its width
     */
    function FixedHeight () {
        ContentStrategy.call(this);
    }
    Fire.JS.extend(FixedHeight, ContentStrategy);

    FixedHeight.prototype.apply = function (designedResolution, viewportSize) {
        var scale = viewportSize.y / designedResolution.y;
        var content = viewportSize;
        return this.buildResult(viewportSize, viewportSize, Fire.v2(scale, scale));
    };

// instance of Content scale strategies

    // index of the array is the value of Fire.ContentStrategyType
    var contentStrategies = [new NoScale(), new FixedHeight()];

    /**
     * @param {Fire.ContentStrategyType} type
     * @returns {Fire.ContentStrategy}
     */
    ContentStrategy.fromType = function (type) {
        var res = contentStrategies[type];
        if (!res) {
            Fire.error('Failed to get ContentStrategy from value', type);
            return contentStrategies[1];
        }
        return res;
    };
})();

///////////////////////////////////////////////////////////////////////////////////////
