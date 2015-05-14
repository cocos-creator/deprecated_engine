/**
 * Class of all entities in scenes.
 * @class Entity
 * @constructor
 * @param {string} name - the name of the entity
 */
var Entity = Fire.Class({

    name: 'Fire.Entity', extends: EventTarget,

    constructor: function () {
        var name = arguments[0];
        this._name = typeof name !== 'undefined' ? name : 'New Entity';

// @ifdef EDITOR
        var editorOptions = arguments[1];
        if (editorOptions) {
            this._objFlags |= editorOptions.flags;
        }
// @endif

        if (Fire._isCloning) {
            // create by deserializer or instantiating

            this._activeInHierarchy = false;
        }
        else {
            // create dynamically

            this._activeInHierarchy = true;
            // init transform
            var transform = new Transform();
            transform.entity = this;
            this._components = [transform];
            this.transform = transform;

            // add to scene
            if (Engine._scene) {
                Engine._scene.appendRoot(this);
            }

            if ( Engine._canModifyCurrentScene ) {
                // invoke callbacks
                Engine._renderContext.onRootEntityCreated(this);

                // activate componet
                transform._onEntityActivated(true);     // 因为是刚刚创建，所以 activeInHierarchy 肯定为 true

// @ifdef EDITOR
                editorCallback.onEntityCreated(this, editorOptions);
                editorCallback.onComponentAdded(this, transform);
// @endif
            }
        }
        //
        this._animator = null;
    },

    properties: {

        name: {
            get: function () {
                return this._name;
            },
            set: function (value) {
                this._name = value;
                // @ifdef EDITOR
                editorCallback.onEntityRenamed(this);
                // @endif
            }
        },

        /**
         * The local active state of this Entity.
         * @property active
         * @type {boolean}
         * @default true
         */
        active: {
            get: function () {
                return this._active;
            },
            set: function (value) {
                // jshint eqeqeq: false
                if (this._active != value) {
                    // jshint eqeqeq: true
                    this._active = value;
                    var canActiveInHierarchy = (!this._parent || this._parent._activeInHierarchy);
                    if (canActiveInHierarchy) {
                        this._onActivatedInHierarchy(value);
                    }
                }
            }
        },

        /**
         * Indicates whether this entity is active in the scene.
         * @property activeInHierarchy
         * @type {boolean}
         */
        activeInHierarchy: {
            get: function () {
                return this._activeInHierarchy;
            }
        },

        /**
         * Returns the {% crosslink Fire.Transform Transform %} attached to the entity.
         * @property transform
         * @type {Transform}
         * @readOnly
         */
        transform: {
            default: null,
            visible: false
        },

        /**
         * The parent of the entity.
         * Changing the parent will keep the transform's local space position, rotation and scale the same but modify
         * the world space position, scale and rotation.
         * @property parent
         * @type {Entity}
         * @default null
         */
        parent: {
            get: function () {
                return this._parent;
            },
            set: function (value) {
                if (this._parent !== value) {
                    if (value === this) {
                        Fire.warn("A entity can't be set as the parent of itself.");
                        return;
                    }
                    if (value && !(value instanceof Entity)) {
                        if (value instanceof Transform) {
                            Fire.error('Entity.parent can not be a Transform, use transform.entity instead.');
                        }
                        else {
                            Fire.error('Entity.parent must be instance of Entity (or must be null)');
                        }
                        return;
                    }
                    var oldParent = this._parent;
                    if (value) {
                        if ((value._objFlags & HideInGame) && !(this._objFlags & HideInGame)) {
                            Fire.error('Failed to set parent, the child\'s HideInGame must equals to parent\'s.');
                            return;
                        }
                        if ((value._objFlags & HideInEditor) && !(this._objFlags & HideInEditor)) {
                            Fire.error('Failed to set parent, the child\'s HideInEditor must equals to parent\'s.');
                            return;
                        }
                        if (!oldParent) {
                            Engine._scene.removeRoot(this);
                        }
                        value._children.push(this);
                    }
                    else {
                        Engine._scene.appendRoot(this);
                    }
                    this._parent = value || null;
                    this.transform._parent = this._parent && this._parent.transform;

                    if (oldParent) {
                        if (!(oldParent._objFlags & Destroying)) {
                            oldParent._children.splice(oldParent._children.indexOf(this), 1);
                            this._onHierarchyChanged(oldParent);
                        }
                    }
                    else {
                        this._onHierarchyChanged(this, null);
                    }

                    Engine._renderContext.onEntityParentChanged(this, oldParent);
// @ifdef EDITOR
                    editorCallback.onEntityParentChanged(this);
// @endif
                }
            }
        },

        /**
         * Get the amount of children
         * @property childCount
         * @type {number}
         */
        childCount: {
            get: function () {
                return this._children.length;
            },
            visible: false
        },

        /**
         * If true, the entity will not be destroyed automatically when loading a new scene.
         * @property dontDestroyOnLoad
         * @type {boolean}
         * @default false
         */
        dontDestroyOnLoad: {
            get: function () {
                return !!(this._objFlags | DontDestroy);
            },
            set: function (value) {
                if (value) {
                    this._objFlags |= DontDestroy;
                }
                else {
                    this._objFlags &= ~DontDestroy;
                }
            }
        },

        // internal properties

        _active: true,
        _parent: null,

        /**
         * @property _children
         * @type {Entity[]}
         * @default []
         * @readOnly
         * @private
         */
        _children: [],

        /**
         * @property _components
         * @type {Component[]}
         * @default []
         * @readOnly
         * @private
         */
        _components: null,

        //// Editor Only
        //_editorOptions: {
        //    default: null,
        //    editorOnly: true
        //}
    },

    ////////////////////////////////////////////////////////////////////
    // overrides
    ////////////////////////////////////////////////////////////////////

    destroy: function () {
        if (FObject.prototype.destroy.call(this)) {
            // disable hierarchy
            if (this._activeInHierarchy) {
                this._deactivateChildComponents();
            }
        }
    },

    _onPreDestroy: function () {
        var parent = this._parent;
        this._objFlags |= Destroying;
        var isTopMost = !(parent && (parent._objFlags & Destroying));
        if (isTopMost) {
            Engine._renderContext.onEntityRemoved(this);
// @ifdef EDITOR
            editorCallback.onEntityRemoved(this/*, isTopMost*/);
// @endif
        }
        // destroy components
        for (var c = 0; c < this._components.length; ++c) {
            var component = this._components[c];
            // destroy immediate so its _onPreDestroy can be called before
            component._destroyImmediate();
        }
        // remove self
        if (parent) {
            if (isTopMost) {
                parent._children.splice(parent._children.indexOf(this), 1);
            }
        }
        else {
            Engine._scene.removeRoot(this);
        }
        // destroy children
        var children = this._children;
        for (var i = 0, len = children.length; i < len; ++i) {
            // destroy immediate so its _onPreDestroy can be called before
            children[i]._destroyImmediate();
        }
        // stop animator
        if (this._animator) {
            this._animator.stop();
        }
    },

    _getCapturingTargets: function (type, array) {
        for (var target = this._parent; target; target = target._parent) {
            if (target._activeInHierarchy && target._capturingListeners && target._capturingListeners.has(type)) {
                array.push(target);
            }
        }
    },

    _getBubblingTargets: function (type, array) {
        for (var target = this._parent; target; target = target._parent) {
            if (target._activeInHierarchy && target._bubblingListeners && target._bubblingListeners.has(type)) {
                array.push(target);
            }
        }
    },

    _doSendEvent: function (event) {
        if (this._activeInHierarchy) {
            Entity.$super.prototype._doSendEvent.call(this, event);
        }
    },

    ////////////////////////////////////////////////////////////////////
    // component methods
    ////////////////////////////////////////////////////////////////////

    /**
     * Adds a component class to the entity. You can also add component to entity by passing in the name of the script.
     *
     * @method addComponent
     * @param {function|string} typeOrName - the constructor or the class name of the component to add
     * @return {Component} - the newly added component
     */
    addComponent: function (typeOrTypename) {
        var constructor;
        if (typeof typeOrTypename === 'string') {
            constructor = JS.getClassByName(typeOrTypename);
            if ( !constructor ) {
                Fire.error('[addComponent] Failed to get class "%s"');
                if (_requiringFrames.length > 0) {
                    Fire.error('You should not add component when the scripts are still loading.', typeOrTypename);
                }
                return null;
            }
        }
        else {
            if ( !typeOrTypename ) {
                Fire.error('[addComponent] Type must be non-nil');
                return null;
            }
            constructor = typeOrTypename;
        }
        if (this._objFlags & Destroying) {
            Fire.error('isDestroying');
            return null;
        }
        if (typeof constructor !== 'function') {
            Fire.error("The component to add must be a constructor");
            return null;
        }
        var component = new constructor();
        component.entity = this;
        this._components.push(component);

        if (this._activeInHierarchy) {
            // call onLoad/onEnable
            component._onEntityActivated(true);
        }

// @ifdef EDITOR
        editorCallback.onComponentAdded(this, component);
// @endif
        return component;
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
        if ( !typeOrTypename ) {
            Fire.error('Argument must be non-nil');
            return;
        }
        var constructor;
        if (typeof typeOrTypename === 'string') {
            constructor = JS.getClassByName(typeOrTypename);
        }
        else {
            constructor = typeOrTypename;
        }
        if (constructor) {
            for (var c = 0; c < this._components.length; ++c) {
                var component = this._components[c];
                if (component instanceof constructor) {
                    return component;
                }
            }
        }
        return null;
    },

    _removeComponent: function (component) {
        /*if (!component) {
            Fire.error('Argument must be non-nil');
            return;
        }*/
        if (!(this._objFlags & Destroying)) {
            //if (component.onHierarchyChanged) {
            //    this.transform._removeListener(component);
            //}
            var i = this._components.indexOf(component);
            if (i !== -1) {
                this._components.splice(i, 1);
                component.entity = null;
// @ifdef EDITOR
                editorCallback.onComponentRemoved(this, component);
// @endif
            }
            else if (component.entity !== this) {
                Fire.error("Component not owned by this entity");
            }
        }
    },

    ////////////////////////////////////////////////////////////////////
    // hierarchy methods
    ////////////////////////////////////////////////////////////////////

    /**
     * Finds an entity by name in all children of this entity. This function will still returns the entity even if it
     * is inactive. It is recommended to not use this function every frame instead cache the result at startup.
     *
     * @method find
     * @param {string} path
     * @return {Entity} - If not found, null will be returned.
     * @beta
     */
    find: function (path) {
        if (!path && path !== '') {
            Fire.error('Argument must be non-nil');
            return;
        }
        if (path[0] === '/') {
            Fire.error("Path should not start with a '/' character, please use \"Fire.Entity.find\" instead");
            return;
        }
        var nameList = path.split('/');

        var match = this;
        var t = 0, len = 0, children = null, subEntity = null;
        for (var i = 0; i < nameList.length; i++) {
            var name = nameList[i];
            if (name === '..') {
                if (!match) {
                    return null;
                }
                match = match._parent;
            }
            else {
                if (!match) {
                    children = Engine._scene.entities;
                }
                else {
                    children = match._children;
                }
                match = null;
                for (t = 0, len = children.length; t < len; ++t) {
                    subEntity = children[t];
                    if (subEntity.name === name) {
                        match = subEntity;
                    }
                }
                if (!match) {
                    return null;
                }
            }
        }
        return match;
    },

    /**
     * Returns an entity child by index.
     *
     * @method getChild
     * @param {number} index
     * @return {Entity} - If not found, undefined will be returned.
     */
    getChild: function (index) {
        return this._children[index];
    },

    /**
     * Returns a new arrays of all children.
     *
     * @method getChildren
     * @return {Entity[]}
     */
    getChildren: function () {
        return this._children.slice();
    },

    /**
     * Is this entity a child of the parent?
     *
     * @method isChildOf
     * @param {Entity} parent
     * @return {boolean} - Returns true if this entity is a child, deep child or identical to the given entity.
     */
    isChildOf: function (parent) {
        var child = this;
        do {
            if (child === parent) {
                return true;
            }
            child = child._parent;
        }
        while (child);
        return false;
    },

    /**
     * Get the sibling index.
     *
     * NOTE: If this entity does not have parent and not belongs to the current scene,
     *       The return value will be -1
     *
     * @method getSiblingIndex
     * @return {number}
     */
    getSiblingIndex: function () {
        if (this._parent) {
            return this._parent._children.indexOf(this);
        }
        else {
            return Engine._scene.entities.indexOf(this);
        }
    },

    /**
     * Get the indexed sibling.
     *
     * @method getSibling
     * @param {number} index
     * @return {Entity} - If not found, undefined will be returned.
     */
    getSibling: function (index) {
        if (this._parent) {
            return this._parent._children[index];
        }
        else {
            return Engine._scene.entities[index];
        }
    },

    /**
     * Set the sibling index of this entity.
     *
     * @method setSiblingIndex
     * @param {number} index
     */
    setSiblingIndex: function (index) {
        var array = this._parent ? this._parent._children : Engine._scene.entities;
        var item = this;
        index = index !== -1 ? index : array.length - 1;
        var oldIndex = array.indexOf(item);
        if (index !== oldIndex) {
            array.splice(oldIndex, 1);
            if (index < array.length) {
                array.splice(index, 0, item);
            }
            else {
                array.push(item);
            }
            // callback
            Engine._renderContext.onEntityIndexChanged(this, oldIndex, index);
// @ifdef EDITOR
            editorCallback.onEntityIndexChanged(this, oldIndex, index);
// @endif
            //this._onHierarchyChanged(this, this.parent);
        }
    },

    /**
     * Move the entity to the top.
     *
     * @method setAsFirstSibling
     */
    setAsFirstSibling: function () {
        this.setSiblingIndex(0);
    },

    /**
     * Move the entity to the bottom.
     *
     * @method setAsLastSibling
     */
    setAsLastSibling: function () {
        this.setSiblingIndex(-1);
    },

    ////////////////////////////////////////////////////////////////////
    // other public methods
    ////////////////////////////////////////////////////////////////////

    /**
     * Tests whether the entity intersects the specified point in world coordinates
     * This ignores the alpha of the renderer.
     *
     * @method hitTest
     * @param {number} worldX The world X position to check.
     * @param {number} worldY The world Y position to check.
     * @return {boolean} A Boolean indicating whether the Entity intersect the specified world position.
     */
    hitTest: function (worldX, worldY) {
        var renderer = this.getComponent(Fire.SpriteRenderer);
        if (! renderer || ! renderer.sprite) {
            return false;
        }

        var worldMatrix = this.transform.getLocalToWorldMatrix();
        var spriteMatrix = new Fire.Matrix23();
        renderer.getSelfMatrix(spriteMatrix);
        // TODO getSelfRenderMatrix
        spriteMatrix.a = renderer.renderWidth / renderer.sprite.width;
        spriteMatrix.d = renderer.renderHeight / renderer.sprite.height;
        if (renderer.sprite.rotated) {
            spriteMatrix.b = spriteMatrix.d;
            spriteMatrix.c = -spriteMatrix.a;
            spriteMatrix.a = 0;
            spriteMatrix.d = 0;
            spriteMatrix.ty -= renderer.height;
        }
        var matrix = spriteMatrix.prepend(worldMatrix);
        matrix.invert();
        var point = matrix.transformPoint(new Fire.Vec2(worldX, worldY));
        // 因为世界坐标是Y轴向上，图片是Y轴向下，所以这边进行图片反转
        point.y = -point.y;
        point.x += renderer.sprite.x;
        point.y += renderer.sprite.y;

        var texture = renderer.sprite.texture;
        if (! texture) {
            return false;
        }

        if (0 < point.x && point.x < texture.width  &&
            0 < point.y && point.y < texture.height) {
            var alphaThreshold = renderer.sprite.alphaThreshold;
            if (renderer.sprite.pixelLevelHitTest && alphaThreshold > 0) {
                return texture.getPixel(point.x, point.y).a >= alphaThreshold;
            }
            return true;
        }
        return false;
    },

    /**
     * @method animate
     * @param {object[]} keyFrames
     * @param {object} timingInput - This dictionary is used as a convenience for specifying the timing properties of
     *                               an Animation in bulk.
     * @return {AnimationNode}
     */
    animate: function (keyFrames, timingInput) {
        if (! this._animator) {
            this._animator = new EntityAnimator(this);
        }
        return this._animator.animate(keyFrames, timingInput);
    },

    ////////////////////////////////////////////////////////////////////
    // internal methods
    ////////////////////////////////////////////////////////////////////

    _onActivatedInHierarchy: function (value) {
        this._activeInHierarchy = value;

        // 当引入DestroyImmediate后，_components的元素有可能会在遍历过程中变少，需要复制一个新的数组，或者做一些标记
        // var components = this._components.slice();

        // component有可能在onEnable时增加，而新增的component已经onEnable了，所以这里事先记下长度，以免重复调用
        var countBefore = this._components.length;
        for (var c = 0; c < countBefore; ++c) {
            var component = this._components[c];
            // @ifdef EDITOR
            if (! (component instanceof Fire.Component)) {
                Fire.error('Sorry, one of entity [%s]\'s component is corrupted! The component which original index is %s has been removed.\nSee DevTools for corrupted value.', this.name, c);
                console.log('Corrupted component value:', component);
                this._removeComponent(component);
                continue;
            }
            // @endif
            component._onEntityActivated(value);
        }
        // activate children recursively
        for (var i = 0, len = this.childCount; i < len; ++i) {
            var entity = this._children[i];
            if (entity._active) {
                entity._onActivatedInHierarchy(value);
            }
        }
        // update animator
        if (this._animator) {
            if (value) {
                this._animator.play();
            }
            else {
                this._animator.stop();
            }
        }
    },

    _deactivateChildComponents: function () {
        // 和 _onActivatedInHierarchy 类似但不修改 this._activeInHierarchy
        var countBefore = this._components.length;
        for (var c = 0; c < countBefore; ++c) {
            var component = this._components[c];
            component._onEntityActivated(false);
        }
        // deactivate children recursively
        for (var i = 0, len = this.childCount; i < len; ++i) {
            var entity = this._children[i];
            if (entity._active) {
                entity._deactivateChildComponents();
            }
        }
    },

    _onHierarchyChanged: function (oldParent) {
        var activeInHierarchyBefore = this._active && (!oldParent || oldParent._activeInHierarchy);
        var shouldActiveNow = this._active && (!this._parent || this._parent._activeInHierarchy);
        if (activeInHierarchyBefore !== shouldActiveNow) {
            this._onActivatedInHierarchy(shouldActiveNow);
        }
    },

    _instantiate: function (position, rotation) {
        // 临时实现版本，之后应该不拷贝scene object
        var oldParent = this._parent;
        this._parent = null;
        var clone = Fire._doInstantiate(this);
        this._parent = oldParent;
        // init
        if (Engine.isPlaying) {
            clone._name = this._name + '(Clone)';
        }
        if (position) {
            clone.transform._position = position;
        }
        if (rotation) {
            clone.transform._rotation = rotation;
        }
        if (Engine._scene) {
            Engine._scene.appendRoot(clone);
        }

        // invoke callbacks
        Engine._renderContext.onEntityCreated(clone, true);
// @ifdef EDITOR
        editorCallback.onEntityCreated(clone);
// @endif
        // activate components
        if (clone._active) {
            clone._onActivatedInHierarchy(true);
        }

        return clone;
    }
});

////////////////////////////////////////////////////////////////////
// static
////////////////////////////////////////////////////////////////////

/**
 * The temp property that indicates the current creating entity should
 * binded with supplied object flags. This property only used in editor.
 *
 * @property _defaultFlags
 * @type {number}
 * @default 0
 * @static
 * @private
 */
Entity._defaultFlags = 0;

/**
 * Finds an entity by hierarchy path, the path is case-sensitive, and must start with a '/' character.
 * It will traverse the hierarchy by splitting the path using '/' character.
 * It is recommended to not use this function every frame instead cache the result at startup.
 *
 * @method find
 * @param {string} path
 * @return {Entity} the entity or null if not found
 * @static
 */
Entity.find = function (path) {
    if (!path && path !== '') {
        Fire.error('Argument must be non-nil');
        return null;
    }
    if (path[0] !== '/') {
        Fire.error("Path must start with a '/' character");
        return null;
    }
    return Engine._scene.findEntity(path);
};

Fire.Entity = Entity;
