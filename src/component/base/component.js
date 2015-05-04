var Component = (function () {

    /**
     * used in _callOnEnable to ensure onEnable and onDisable will be called alternately
     * 从逻辑上来说OnEnable和OnDisable的交替调用不需要由额外的变量进行保护，但那样会使设计变得复杂
     * 例如Entity.destroy调用后但还未真正销毁时，会调用所有Component的OnDisable。
     * 这时如果又有addComponent，Entity需要对这些新来的Component特殊处理。将来调度器做了之后可以尝试去掉这个标记。
     */
    var IsOnEnableCalled = Fire._ObjectFlags.IsOnEnableCalled;

    // IsOnEnableCalled 会收到 executeInEditMode 的影响，IsEditorOnEnabledCalled 不会
    var IsEditorOnEnabledCalled = Fire._ObjectFlags.IsEditorOnEnabledCalled;
    var IsOnLoadCalled = Fire._ObjectFlags.IsOnLoadCalled;
    var IsOnStartCalled = Fire._ObjectFlags.IsOnStartCalled;

    var compCtor;
// @ifdef EDITOR
    compCtor = function () {
        Editor._AssetsWatcher.initComponent(this);
    };
// @endif

    /**
     * Base class for everything attached to Entity.
     *
     * NOTE: Not allowed to use construction parameters for Component's subclasses,
     *         because Component is created by the engine.
     *
     * @class Component
     * @extends HashObject
     * @constructor
     */
    var Component = Fire.extend('Fire.Component', HashObject, compCtor);

    /**
     * The entity this component is attached to. A component is always attached to an entity.
     * @property entity
     * @type {Entity}
     */
    Component.prop('entity', null, Fire.HideInInspector);

    // @ifdef EDITOR

    // 如果不带有 uuid，则返回空字符串
    Component.getset('_scriptUuid',
        function () {
            return this._cacheUuid || '';
        },
        function (value) {
            if (this._cacheUuid !== value) {
                if (value && Editor.isUuid(value)) {
                    var classId = Editor.compressUuid(value);
                    var newComp = Fire.JS._getClassById(classId);
                    if (newComp) {
                        Fire.warn('Sorry, replacing component script is not yet implemented.');
                        //Editor.sendToWindows('reload:window-scripts', Editor._Sandbox.compiled);
                    }
                    else {
                        Fire.error('Can not find a component in the script which uuid is "%s".', value);
                    }
                }
                else {
                    Fire.error('invalid script');
                }
            }
        },
        Fire.DisplayName("Script"),
        Fire._ScriptUuid
    );

    // @endif

    /**
     * @property _enabled
     * @type boolean
     * @private
     */
    Component.prop('_enabled', true, Fire.HideInInspector);

    // properties

    /**
     * indicates whether this component is enabled or not.
     * @property enabled
     * @type boolean
     * @default true
     */
    Object.defineProperty(Component.prototype, 'enabled', {
        get: function () {
            return this._enabled;
        },
        set: function (value) {
            // jshint eqeqeq: false
            if (this._enabled != value) {
                // jshint eqeqeq: true
                this._enabled = value;
                if (this.entity._activeInHierarchy) {
                    _callOnEnable(this, value);
                }
            }
        }
    });

    /**
     * indicates whether this component is enabled and its entity is also active in the hierarchy.
     * @property enabledInHierarchy
     * @type {boolean}
     * @readOnly
     */
    Object.defineProperty(Component.prototype, 'enabledInHierarchy', {
        get: function () {
            return this._enabled && this.entity._activeInHierarchy;
        }
    });

    /**
     * Returns the {% crosslink Fire.Transform Transform %} attached to the entity.
     * @property transform
     * @type {Transform}
     * @readOnly
     */
    Object.defineProperty(Component.prototype, 'transform', {
        get: function () {
            return this.entity.transform;
        }
    });

    // callback functions

    /**
     * Update is called every frame, if the Component is enabled.
     * @event update
     */
    Component.prototype.update = null;

    /**
     * LateUpdate is called every frame, if the Component is enabled.
     * @event lateUpdate
     */
    Component.prototype.lateUpdate = null;
    //(NYI) Component.prototype.onCreate = null;  // customized constructor for template

    /**
     * When attaching to an active entity or its entity first activated
     * @event onLoad
     */
    Component.prototype.onLoad = null;

    /**
     * Called before all scripts' update if the Component is enabled
     * @event start
     */
    Component.prototype.start = null;

    /**
     * Called when this component becomes enabled and its entity becomes active
     * @event onEnable
     */
    Component.prototype.onEnable = null;

    /**
     * Called when this component becomes disabled or its entity becomes inactive
     * @event onDisable
     */
    Component.prototype.onDisable = null;

    /**
     * Called when this component will be destroyed.
     * @event onDestroy
     */
    Component.prototype.onDestroy = null;

    /**
     * Called when the engine starts rendering the scene.
     * @event onPreRender
     */
    Component.prototype.onPreRender = null;


    /**
     * Adds a component class to the entity. You can also add component to entity by passing in the name of the script.
     *
     * @method addComponent
     * @param {function|string} typeOrName - the constructor or the class name of the component to add
     * @return {Component} - the newly added component
     */
    Component.prototype.addComponent = function (typeOrTypename) {
        return this.entity.addComponent(typeOrTypename);
    };

    /**
     * Returns the component of supplied type if the entity has one attached, null if it doesn't. You can also get component in the entity by passing in the name of the script.
     *
     * @method getComponent
     * @param {function|string} typeOrName
     * @return {Component}
     */
    Component.prototype.getComponent = function (typeOrTypename) {
        return this.entity.getComponent(typeOrTypename);
    };

    ///**
    // * This method will be invoked when the scene graph changed, which is means the parent of its transform changed,
    // * or one of its ancestor's parent changed, or one of their sibling index changed.
    // * NOTE: This callback only available after onLoad.
    // *
    // * @param {Transform} transform - the transform which is changed, can be any of this transform's ancestor.
    // * @param {Transform} oldParent - the transform's old parent, if not changed, its sibling index changed.
    // * @return {boolean} return whether stop propagation to this component's child components.
    // */
    //Component.prototype.onHierarchyChanged = function (transform, oldParent) {};

    // overrides

    Component.prototype.destroy = function () {
        if (FObject.prototype.destroy.call(this)) {
            if (this._enabled && this.entity._activeInHierarchy) {
                _callOnEnable(this, false);
            }
        }
    };

// @ifdef EDITOR
    function call_FUNC_InTryCatch (c) {
        try {
            c._FUNC_();
        }
        catch (e) {
            Fire._throw(e);
        }
    }
    var execInTryCatchTmpl = '(' + call_FUNC_InTryCatch + ')';
    // jshint evil: true
    var callOnEnableInTryCatch = eval(execInTryCatchTmpl.replace(/_FUNC_/g, 'onEnable'));
    var callOnDisableInTryCatch = eval(execInTryCatchTmpl.replace(/_FUNC_/g, 'onDisable'));
    var callOnLoadInTryCatch = eval(execInTryCatchTmpl.replace(/_FUNC_/g, 'onLoad'));
    var callOnStartInTryCatch = eval(execInTryCatchTmpl.replace(/_FUNC_/g, 'start'));
    var callOnDestroyInTryCatch = eval(execInTryCatchTmpl.replace(/_FUNC_/g, 'onDestroy'));
    // jshint evil: false
// @endif

    // Should not call onEnable/onDisable in other place
    function _callOnEnable (self, enable) {
// @ifdef EDITOR
        if ( enable ) {
            if ( !(self._objFlags & IsEditorOnEnabledCalled) ) {
                self._objFlags |= IsEditorOnEnabledCalled;
                editorCallback.onComponentEnabled(self);
            }
        }
        else {
            if ( self._objFlags & IsEditorOnEnabledCalled ) {
                self._objFlags &= ~IsEditorOnEnabledCalled;
                editorCallback.onComponentDisabled(self);
            }
        }
        if ( !(Fire.Engine.isPlaying || Fire.attr(self, 'executeInEditMode')) ) {
            return;
        }
// @endif
        if ( enable ) {
            if ( !(self._objFlags & IsOnEnableCalled) ) {
                self._objFlags |= IsOnEnableCalled;
                if ( self.onEnable ) {
// @ifdef EDITOR
                    callOnEnableInTryCatch(self);
// @endif
// @ifndef EDITOR
                    self.onEnable();
// @endif
                }
            }

        }
        else {
            if ( self._objFlags & IsOnEnableCalled ) {
                self._objFlags &= ~IsOnEnableCalled;
                if ( self.onDisable ) {
// @ifdef EDITOR
                    callOnDisableInTryCatch(self);
// @endif
// @ifndef EDITOR
                    self.onDisable();
// @endif
                }
            }
        }
    }

    Component.prototype._onEntityActivated = function (active) {
// @ifdef EDITOR
        if ( !(this._objFlags & IsOnLoadCalled) && (Fire.Engine.isPlaying || Fire.attr(this, 'executeInEditMode')) ) {
            this._objFlags |= IsOnLoadCalled;
            if (this.onLoad) {
                callOnLoadInTryCatch(this);
            }
            Editor._AssetsWatcher.start(this);
            //if (this.onHierarchyChanged) {
            //    this.entity.transform._addListener(this);
            //}
        }
// @endif
// @ifndef EDITOR
        if ( !(this._objFlags & IsOnLoadCalled) ) {
            this._objFlags |= IsOnLoadCalled;
            if (this.onLoad) {
                this.onLoad();
            }
            //if (this.onHierarchyChanged) {
            //    this.entity.transform._addListener(this);
            //}
        }
// @endif
        if (this._enabled) {
            _callOnEnable(this, active);
        }
    };

    /**
     * invoke starts on entities
     * @param {Entity} entity
     */
    Component._invokeStarts = function (entity) {
        var countBefore = entity._components.length;
        var c = 0, comp = null;
        // @ifdef EDITOR
        if (Fire.Engine.isPlaying) {
        // @endif
            for (; c < countBefore; ++c) {
                comp = entity._components[c];
                if ( !(comp._objFlags & IsOnStartCalled) ) {
                    comp._objFlags |= IsOnStartCalled;
                    if (comp.start) {
                        // @ifdef EDITOR
                        callOnStartInTryCatch(comp);
                        // @endif
                        // @ifndef EDITOR
                        comp.start();
                        // @endif
                    }
                }
            }
        // @ifdef EDITOR
        }
        else {
            for (; c < countBefore; ++c) {
                comp = entity._components[c];
                if ( !(comp._objFlags & IsOnStartCalled) && Fire.attr(comp, 'executeInEditMode')) {
                    comp._objFlags |= IsOnStartCalled;
                    if (comp.start) {
                        callOnStartInTryCatch(comp);
                    }
                }
            }
        }
        // @endif
        // activate its children recursively
        for (var i = 0, children = entity._children, len = children.length; i < len; ++i) {
            var child = children[i];
            if (child._active) {
                Component._invokeStarts(child);
            }
        }
    };

    Component.prototype._onPreDestroy = function () {
        // ensure onDisable called
        _callOnEnable(this, false);
        // onDestroy
// @ifdef EDITOR
        Editor._AssetsWatcher.stop(this);
        if (Fire.Engine.isPlaying || Fire.attr(this, 'executeInEditMode')) {
            if (this.onDestroy) {
                callOnDestroyInTryCatch(this);
            }
        }
// @endif
// @ifndef EDITOR
        if (this.onDestroy) {
            this.onDestroy();
        }
// @endif
        // remove component
        this.entity._removeComponent(this);
    };

    return Component;
})();

Fire.Component = Component;

////////////////////////////////////////////////////////////////////////////////
// Component helpers

// Register Component Menu

// @ifdef EDITOR
Fire._componentMenuItems = [];
// @endif

/**
 * @module Fire
 */
/**
 * Register a component to the "Component" menu.
 *
 * @method addComponentMenu
 * @param {function} constructor - the class you want to register, must inherit from Component
 * @param {string} menuPath - the menu path name. Eg. "Rendering/Camera"
 * @param {number} [priority] - the order which the menu item are displayed
 */
Fire.addComponentMenu = function (constructor, menuPath, priority) {
    // @ifdef EDITOR
    if ( !Fire.isChildClassOf(constructor, Component) ) {
        Fire.error('[Fire.addComponentMenu] constructor must inherit from Component');
        return;
    }
    Fire._componentMenuItems.push({
        component: constructor,
        menuPath: menuPath,
        priority: priority
    });
    // @endif
};

// @ifdef EDITOR
Fire.attr(Component, 'executeInEditMode', false);
// @endif

/**
 * Makes a component execute in edit mode.
 * By default, all components are only executed in play mode,
 * which means they will not have their callback functions executed while the Editor is in edit mode.
 * By calling this function, each component will also have its callback executed in edit mode.
 *
 * @method executeInEditMode
 * @param {Component} constructor - the class you want to register, must inherit from Component
 */
Fire.executeInEditMode = function (constructor) {
    // @ifdef EDITOR
    if ( !Fire.isChildClassOf(constructor, Component) ) {
        Fire.error('[Fire.executeInEditMode] constructor must inherit from Component');
        return;
    }
    Fire.attr(constructor, 'executeInEditMode', true);
    // @endif
};
