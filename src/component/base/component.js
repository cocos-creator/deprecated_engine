var Component = (function () {

    // -------------------
    // used in _callOnEnable to ensure onEnable and onDisable will be called alternately
    // 从逻辑上来说OnEnable和OnDisable的交替调用不需要由额外的变量进行保护，但那样会使设计变得复杂
    // 例如Entity.destroy调用后但还未真正销毁时，会调用所有Component的OnDisable。
    // 这时如果又有addComponent，Entity需要对这些新来的Component特殊处理。将来调度器做了之后可以尝试去掉这个标记。
    //
    //
    var IsOnEnableCalled = Fire._ObjectFlags.IsOnEnableCalled;

    // IsOnEnableCalled 会收到 executeInEditMode 的影响，IsEditorOnEnabledCalled 不会
    var IsEditorOnEnabledCalled = Fire._ObjectFlags.IsEditorOnEnabledCalled;
    var IsOnLoadCalled = Fire._ObjectFlags.IsOnLoadCalled;
    var IsOnStartCalled = Fire._ObjectFlags.IsOnStartCalled;

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
        if ( !(Engine.isPlaying || Fire.attr(self, 'executeInEditMode')) ) {
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

    var createInvoker = function (timerFunc, timerWithKeyFunc, errorInfo) {
        return function (functionOrMethodName, time) {
            var ms = (time || 0) * 1000;
            var self = this;
            if (typeof functionOrMethodName === "function") {
                return timerFunc(function () {
                    if (self.isValid) {
                        functionOrMethodName.call(self);
                    }
                }, ms);
            }
            else {
                var method = this[functionOrMethodName];
                if (typeof method === 'function') {
                    var key = this.id + '.' + functionOrMethodName;
                    timerWithKeyFunc(function () {
                        if (self.isValid) {
                            method.call(self);
                        }
                    }, ms, key);
                }
                else {
                    Fire.error('Can not %s %s.%s because it is not a valid function.', errorInfo, JS.getClassName(this), functionOrMethodName);
                }
            }
        };
    };

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
    var Component = Fire.Class({

        name: 'Fire.Component',
        extends: HashObject,
        constructor: compCtor,

        properties: {
            /**
             * The entity this component is attached to. A component is always attached to an entity.
             * @property entity
             * @type {Entity}
             */
            entity: {
                default: null,
                visible: false
            },

            // @ifdef EDITOR
            _scriptUuid: {
                get: function () {
                    // 如果不带有 uuid，则返回空字符串
                    return this._cacheUuid || '';
                },
                set: function (value) {
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
                displayName: 'Script',
                type: Fire._ScriptUuid
            },
            // @endif

            /**
             * @property _enabled
             * @type boolean
             * @private
             */
            _enabled: true,

            /**
             * indicates whether this component is enabled or not.
             * @property enabled
             * @type boolean
             * @default true
             */
            enabled: {
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
                },
                visible: false
            },

            /**
             * indicates whether this component is enabled and its entity is also active in the hierarchy.
             * @property enabledInHierarchy
             * @type {boolean}
             * @readOnly
             */
            enabledInHierarchy: {
                get: function () {
                    return this._enabled && this.entity._activeInHierarchy;
                },
                visible: false
            },

            /**
             * Returns the {% crosslink Fire.Transform Transform %} attached to the entity.
             * @property transform
             * @type {Transform}
             * @readOnly
             */
            transform: {
                get: function () {
                    return this.entity.transform;
                },
                visible: false
            },

            /**
             * @property isOnLoadCalled
             * @type {boolean}
             * @readOnly
             */
            isOnLoadCalled: {
                get: function () {
                    return this._objFlags & IsOnLoadCalled;
                },
                visible: false
            }
        },

        // callback functions

        /**
         * Update is called every frame, if the Component is enabled.
         * @method update
         */
        update: null,

        /**
         * LateUpdate is called every frame, if the Component is enabled.
         * @method lateUpdate
         */
        lateUpdate: null,
        //(NYI) onCreate = null;  // customized constructor for template

        /**
         * When attaching to an active entity or its entity first activated
         * @method onLoad
         */
        onLoad: null,

        /**
         * Called before all scripts' update if the Component is enabled
         * @method start
         */
        start: null,

        /**
         * Called when this component becomes enabled and its entity becomes active
         * @method onEnable
         */
        onEnable: null,

        /**
         * Called when this component becomes disabled or its entity becomes inactive
         * @method onDisable
         */
        onDisable: null,

        /**
         * Called when this component will be destroyed.
         * @method onDestroy
         */
        onDestroy: null,

        /**
         * Called when the engine starts rendering the scene.
         * @method onPreRender
         */
        onPreRender: null,

        // @ifdef EDITOR
        /**
         * @method onFocusInEditMode
         */
        onFocusInEditMode: null,
        /**
         * @method onLostFocusInEditMode
         */
        onLostFocusInEditMode: null,
        // @endif

        /**
         * Adds a component class to the entity. You can also add component to entity by passing in the name of the
         * script.
         *
         * @method addComponent
         * @param {function|string} typeOrName - the constructor or the class name of the component to add
         * @return {Component} - the newly added component
         */
        addComponent: function (typeOrTypename) {
            return this.entity.addComponent(typeOrTypename);
        },

        /**
         * Returns the component of supplied type if the entity has one attached, null if it doesn't. You can also get
         * component in the entity by passing in the name of the script.
         *
         * @method getComponent
         * @param {function|string} typeOrName
         * @return {Component}
         */
        getComponent: function (typeOrTypename) {
            return this.entity.getComponent(typeOrTypename);
        },

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

        /**
         * Invokes the method on this component after a specified delay.
         * The method will be invoked even if this component is disabled, but will not invoked if this component is
         * destroyed.
         *
         * @method invoke
         * @param {function|string} functionOrMethodName
         * @param {number} [delay=0] - The number of seconds that the function call should be delayed by. If omitted, it defaults to 0. The actual delay may be longer.
         * @return {number} - Will returns a new InvokeID if the functionOrMethodName is type function. InvokeID is the numerical ID of the invoke, which can be used later with cancelInvoke().
         * @example {@link examples/Fire/Component/invoke.js }
         */
        invoke: createInvoker(Timer.setTimeout, Timer.setTimeoutWithKey, 'invoke'),

        /**
         * Invokes the method on this component repeatedly, with a fixed time delay between each call.
         * The method will be invoked even if this component is disabled, but will not invoked if this component is
         * destroyed.
         *
         * @method repeat
         * @param {function|string} functionOrMethodName
         * @param {number} [delay=0] - The number of seconds that the function call should wait before each call to the method. If omitted, it defaults to 0. The actual delay may be longer.
         * @return {number} - Will returns a new RepeatID if the method is type function. RepeatID is the numerical ID of the repeat, which can be used later with cancelRepeat().
         * @example {@link examples/Fire/Component/repeat.js}
         */
        repeat: createInvoker(Timer.setInterval, Timer.setIntervalWithKey, 'repeat'),

        /**
         * Cancels previous invoke calls with methodName or InvokeID on this component.
         * When using methodName, all calls with the same methodName will be canceled.
         * InvokeID is the identifier of the invoke action you want to cancel, as returned by invoke().
         *
         * @method cancelInvoke
         * @param {string|number} methodNameOrInvokeId
         * @example {@link examples/Fire/Component/cancelInvoke.js}
         */
        cancelInvoke: function (methodNameOrInvokeId) {
            if (typeof methodNameOrInvokeId === 'string') {
                var key = this.id + '.' + methodNameOrInvokeId;
                Timer.clearTimeoutByKey(key);
            }
            else {
                Timer.clearTimeout(methodNameOrInvokeId);
            }
        },

        /**
         * Cancels previous repeat calls with methodName or RepeatID on this component.
         * When using methodName, all calls with the same methodName will be canceled.
         * RepeatID is the identifier of the repeat action you want to cancel, as returned by repeat().
         *
         * @method cancelRepeat
         * @param {string|number} methodNameOrRepeatId
         * @example {@link examples/Fire/Component/cancelRepeat.js}
         */
        cancelRepeat: function (methodNameOrRepeatId) {
            if (typeof methodNameOrRepeatId === 'string') {
                var key = this.id + '.' + methodNameOrRepeatId;
                Timer.clearIntervalByKey(key);
            }
            else {
                Timer.clearInterval(methodNameOrRepeatId);
            }
        },

        // overrides

        destroy: function () {
            if (FObject.prototype.destroy.call(this)) {
                if (this._enabled && this.entity._activeInHierarchy) {
                    _callOnEnable(this, false);
                }
            }
        },

        _onEntityActivated: function (active) {
            // @ifdef EDITOR
            if (!(this._objFlags & IsOnLoadCalled) && (Engine.isPlaying || Fire.attr(this, 'executeInEditMode'))) {
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
            if (!(this._objFlags & IsOnLoadCalled)) {
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
        },

        statics: {
            /**
             * invoke starts on entities
             * @param {Entity} entity
             */
            _invokeStarts: function (entity) {
                var countBefore = entity._components.length;
                var c = 0, comp = null;
                // @ifdef EDITOR
                if (Engine.isPlaying) {
                    // @endif
                    for (; c < countBefore; ++c) {
                        comp = entity._components[c];
                        if (!(comp._objFlags & IsOnStartCalled)) {
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
                        if (!(comp._objFlags & IsOnStartCalled) && Fire.attr(comp, 'executeInEditMode')) {
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
            }
        },

        _onPreDestroy: function () {
            // ensure onDisable called
            _callOnEnable(this, false);
            // onDestroy
            // @ifdef EDITOR
            Editor._AssetsWatcher.stop(this);
            if (Engine.isPlaying || Fire.attr(this, 'executeInEditMode')) {
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
        }
    });

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
 * @param {Component} constructor - The class you want to register, must inherit from Component.
 * @param {boolean} [live=false] - If true, the scene view will keep updating this entity in 60 fps when it is selected,
 *                         otherwise, it will update only if necessary.
 */
Fire.executeInEditMode = function (constructor, live) {
    // @ifdef EDITOR
    if ( !Fire.isChildClassOf(constructor, Component) ) {
        Fire.error('[Fire.executeInEditMode] constructor must inherit from Component');
        return;
    }
    Fire.attr(constructor, 'executeInEditMode', true);
    if (live) {
        Fire.attr(constructor, 'liveInEditMode', true);
    }
    // @endif
};
