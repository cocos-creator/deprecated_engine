
var MissingScript = (function () {

    ///**
    // * A temp fallback to contain the original component which can not be loaded.
    // * Actually, this class will be used whenever a class failed to deserialize,
    // * regardless of whether it is child class of component.
    // */
    var MissingScript = Fire.Class({
        name: 'Fire.MissingScript',
        extends: Component,
        onLoad: function () {
            Fire.warn('The referenced script on this Component is missing!');
        }
    });

    return MissingScript;
})();

Fire._MissingScript = MissingScript;
