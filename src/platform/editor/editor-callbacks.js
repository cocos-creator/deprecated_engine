
///**
// * Overridable callbacks for editor, use `Fire.Engine._editorCallback` to access this module
// * @class _editorCallback
// * @static
// * @private
// */
var editorCallback = {


    onEnginePlayed: function () {},
    onEngineStopped: function () {},
    onEnginePaused: function () {},

    // This will be called before component callbacks
    onEntityCreated: function () {},

    /**
     * removes an entity and all its children from scene, this method will NOT be called if it is removed by hierarchy.
     * @method onEntityRemoved
     * @param {Entity} entity - the entity to remove
     * @param {boolean} isTopMost - indicates whether it is the most top one among the entities who will be deleted in one operation
     */
    onEntityRemoved: function () {},

    onEntityParentChanged: function () {},

    /**
     * @method onEntityIndexChanged
     * @param {Entity} entity
     * @param {number} oldIndex
     * @param {number} newIndex
     */
    onEntityIndexChanged: function () {},

    onEntityRenamed: function () {},

    /**
     * @method onStartUnloadScene
     * @param {Scene} scene
     */
    onStartUnloadScene: function () {},

    /**
     * @method onSceneLaunched
     * @param {Scene} scene
     */
    onSceneLaunched: function () {},

    /**
     * @method onBeforeActivateScene
     * @param {Scene} scene
     */
    onBeforeActivateScene: function () {},

    ///**
    // * @param {Scene} scene
    // */
    //onSceneLoaded: null,

    onComponentEnabled: function () {},
    onComponentDisabled: function () {},

    /**
     * @method onComponentAdded
     * @param {Entity} entity
     * @param {Component} component
     */
    onComponentAdded: function () {},

    /**
     * @method onComponentRemoved
     * @param {Entity} entity
     * @param {Component} component
     */
    onComponentRemoved: function () {}
};
