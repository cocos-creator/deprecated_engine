//
// 动画数据类，相当于 AnimationClip。
// 虽然叫做 AnimCurve，但除了曲线，可以保存任何类型的值。
//
// @class AnimCurve
// @constructor
//
var AnimCurve = Fire.Class({
    name: 'Fire.AnimCurve',

    //
    // @method sample
    // @param {number} time
    // @param {number} ratio - The normalized time specified as a number between 0.0 and 1.0 inclusive.
    // @param {Animator} animator
    //
    sample: function (time, ratio, animator) {}
});

//
// 区别于 SampledAnimCurve。
//
// @class DynamicAnimCurve
// @constructor
// @extends AnimCurve
//
var DynamicAnimCurve = Fire.Class({
    name: 'Fire.DynamicAnimCurve',
    properties: {

        // The object being animated.
        // @property target
        // @type {object}
        target: null,

        // The name of the property being animated.
        // @property prop
        // @type {string}
        prop: "",

        // The values of the keyframes. (y)
        // @property values
        // @type {any[]}
        values: [],

        // The keyframe ratio of the keyframe specified as a number between 0.0 and 1.0 inclusive. (x)
        // @property ratios
        // @type {number[]}
        ratios: [],

        // @property types
        // @param {object[]}
        // Each array item maybe type:
        // - [x, x, x, x]: Four control points for bezier
        // - null: linear
        types: [],

        // @property {string[]} subProps - The path of sub property being animated.
        subProps: null
    },

    sample: function (time, ratio, animator) {
        var values = this.values;
        var ratios = this.ratios;
        var frameCount = ratios.length;
        if (frameCount === 0) {
            return;
        }
        // evaluate value
        var value;
        var index = Fire.binarySearch(ratios, ratio);
        if (index < 0) {
            index = ~index;
            if (index <= 0) {
                value = values[0];
            }
            else if (index >= frameCount) {
                value = values[frameCount - 1];
            }
            else {
                var fromRatio = ratios[index - 1];
                var toRatio = ratios[index];
                var fromVal = values[index - 1];
                var toVal = values[index];
                var type = this.types[index - 1];
                var ratioBetweenFrames = (ratio - fromRatio) / (toRatio - fromRatio);

                if (Array.isArray(type)) {
                    // bezier curve
                    ratioBetweenFrames = bezier(type, ratioBetweenFrames);
                }

                // lerp
                if (typeof fromVal === 'number') {
                    value = fromVal + (toVal - fromVal) * ratioBetweenFrames;
                }
                else {
                    var lerp = fromVal.lerp;
                    if (lerp) {
                        value = fromVal.lerp(toVal, ratioBetweenFrames);
                    }
                    else {
                        // no linear lerp function, just return last frame
                        value = fromVal;
                    }
                }
            }
        }
        else {
            value = values[index];
        }
        var subProps = this.subProps;
        if (subProps) {
            // create batched value dynamically
            var mainProp = this.target[this.prop];
            var subProp = mainProp;
            for (var i = 0; i < subProps.length - 1; i++) {
                var subPropName = subProps[i];
                if (subProp) {
                    subProp = subProp[subPropName];
                }
                else {
                    return;
                }
            }
            var propName = subProps[subProps.length - 1];
            if (subProp) {
                subProp[propName] = value;
            }
            else {
                return;
            }
            value = mainProp;
        }
        // apply value
        this.target[this.prop] = value;
    }
});

DynamicAnimCurve.Linear = null;
DynamicAnimCurve.Bezier = function (controlPoints) {
    return controlPoints;
};

// @ifdef DEV
__TESTONLY__.DynamicAnimCurve = DynamicAnimCurve;
// @endif
