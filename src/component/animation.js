/**
 * @class Animation
 * @extends Component
 * @constructor
 */
var Animation = Fire.Class({
    //
    name: "Fire.Animation",

    //
    extends: Fire.Component,

    properties: {
        defaultAnimation: {
            default: null,
            type: Fire.AnimationClip,
        },

        animations: {
            default: [],
            type: Fire.AnimationClip,
        },
    },

    constructor: function () {
    },
});

Fire.addComponentMenu(Animation, 'Animation');

Fire.Animation = Animation;
