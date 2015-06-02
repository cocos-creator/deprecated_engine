var Transform = (function () {

    var ERR_NaN = 'The %s must not be NaN';

    /**
     * Defines position, rotation and scale of an entity.
     *
     * @class Transform
     * @extends Component
     * @constructor
     */
    var Transform = Fire.Class({
        name: 'Fire.Transform',
        extends: Component,
        constructor: function () {
            /**
             * @property _position;
             * @type {Vec2}
             * @default new Vec2(0, 0)
             * @private
             */
            this._position = new Vec2(0, 0);
            /**
             * @property _scale;
             * @type {Vec2}
             * @default new Vec2(1, 1)
             * @private
             */
            this._scale = new Vec2(1, 1);

            this._worldTransform = new Matrix23();

            /**
             * the cached reference to parent transform
             * @property _parent
             * @type {Transform}
             * @default null
             * @private
             */
            this._parent = null;

            //this._hierarchyChangedListeners = null;
        },

        properties: {
            _position: null,
            _rotation: 0,
            _scale: null,
            /**
             * The local position in its parent's coordinate system
             * @property position
             * @type {Vec2}
             * @default new Vec2(0, 0)
             */
            position: {
                get: function () {
                    return new Vec2(this._position.x, this._position.y);
                },
                set: function (value) {
                    var x = value.x;
                    var y = value.y;
                    if ( !isNaN(x) && !isNaN(y) ) {
                        this._position.x = x;
                        this._position.y = y;
                    }
                    else {
                        Fire.error(ERR_NaN, 'xy of new position');
                    }
                },
                tooltip: "The local position in its parent's coordinate system"
            },
            /**
             * The counterclockwise degrees of rotation relative to the parent
             * @property rotation
             * @type {number}
             * @default 0
             */
            rotation: {
                get: function () {
                    return this._rotation;
                },
                set: function (value) {
                    if ( !isNaN(value) ) {
                        this._rotation = value;
                    }
                    else {
                        Fire.error(ERR_NaN, 'new rotation');
                    }
                },
                tooltip: "The counterclockwise degrees of rotation relative to the parent"
            },
            /**
             * The local scale factor relative to the parent
             * @property scale
             * @type {Vec2}
             * @default new Vec2(1, 1)
             */
            scale: {
                get: function () {
                    return new Vec2(this._scale.x, this._scale.y);
                },
                set: function (value) {
                    var x = value.x;
                    var y = value.y;
                    if ( !isNaN(x) && !isNaN(y) ) {
                        this._scale.x = x;
                        this._scale.y = y;
                    }
                    else {
                        Fire.error(ERR_NaN, 'xy of new scale');
                    }
                },
                tooltip: "The local scale factor relative to the parent"
            }
        },
        // override functions

        onLoad: function () {
            this._parent = this.entity._parent && this.entity._parent.transform;
        },
        destroy: function () {
            // @ifdef EDITOR
            Fire.error("Can't destroy Transform component of '%s', destroying the transform component is not allowed." +
                "If you want to destroy the entity, please call 'destroy' on the entity instead.", this.entity.name);
            // @endif
        },
        // other functions
        _updateTransform: function (parentMatrix) {
            //var mat = this._worldTransform;

            //var px = this._pivot.x;
            //var py = this._pivot.y;

            //var radians = this._rotation * 0.017453292519943295;
            //var sin = this._rotation === 0 ? 0 : Math.sin(radians);
            //var cos = this._rotation === 0 ? 1 : Math.cos(radians);

            //// get local
            //mat.a = this._scale.x * cos;
            //mat.b = this._scale.x * sin;   // 这里如果是pixi，b和c是反过来的
            //mat.c = this._scale.y * - sin;
            //mat.d = this._scale.y * cos;
            //mat.tx = this._position.x;
            //mat.ty = this._position.y;

            //// parent
            //var pa = parentMatrix.a;
            //var pb = parentMatrix.b;
            //var pc = parentMatrix.c;
            //var pd = parentMatrix.d;

            //// local x parent
            //if (pa !== 1 || pb !== 0 || pc !== 0 || pd !== 1) {
            //    mat.a = mat.a * pa + mat.b * pc;
            //    mat.b = mat.a * pb + mat.b * pd;
            //    mat.c = mat.c * pa + mat.d * pc;
            //    mat.d = mat.c * pb + mat.d * pd;
            //    mat.tx = mat.tx * pa + mat.ty * pc + parentMatrix.tx;
            //    mat.ty = mat.tx * pb + mat.ty * pd + parentMatrix.ty;
            //}
            //else {
            //    mat.tx += parentMatrix.tx;
            //    mat.ty += parentMatrix.ty;
            //}

            var mat = this._worldTransform;
            this.getLocalMatrix(mat);
            mat.prepend(parentMatrix);

            //this._worldAlpha = this._alpha * this._parent._worldAlpha;

            // update children
            var children = this.entity._children;
            for (var i = 0, len = children.length; i < len; i++) {
                children[i].transform._updateTransform(mat);
            }
        },
        _updateRootTransform: function () {
            var mat = this._worldTransform;
            this.getLocalMatrix(mat);
            //this._worldAlpha = this._alpha;

            // update children
            var children = this.entity._children;
            for (var i = 0, len = children.length; i < len; i++) {
                children[i].transform._updateTransform(mat);
            }
        },
        /**
         * Get the local matrix that transforms a point from local space into parents space.
         * @method getLocalMatrix
         * @param {Matrix23} [out] - optional, the receiving vector
         * @return {Matrix23}
         */
        getLocalMatrix: function (out) {
            out = out || new Matrix23();

            //var px = this._pivot.x;
            //var py = this._pivot.y;

            var radians = this._rotation * 0.017453292519943295;
            var sin = this._rotation === 0 ? 0 : Math.sin(radians);
            var cos = this._rotation === 0 ? 1 : Math.cos(radians);

            out.a = this._scale.x * cos;   // scaleMat.a * rotateMat.a(cos) 00
            // 这里如果是pixi，b和c是反过来的
            out.b = this._scale.x * sin;   // scaleMat.a * rotateMat.b(sin)
            out.c = this._scale.y * - sin; // scaleMat.d * rotateMat.c(-sin)
            //
            out.d = this._scale.y * cos;   // scaleMat.d * rotateMat.d(cos) 11
            out.tx = this._position.x;/* * ra + this._position.y * rc*/
            out.ty = this._position.y;/* * rb + this._position.y * rd*/
            //out.tx = this._position.x/* - out.a * px - py * out.b*/;    // 02
            //out.ty = this._position.y/* - out.d * py - px * out.c*/;    // 12

            //above should equivalent to:
            //  var t = new Matrix23();
            //  t.tx = this._position.x;
            //  t.ty = this._position.y;
            //  var r = new Matrix23();
            //  r.rotate(radians);
            //  var s = new Matrix23();
            //  s.setScale(this._scale);
            //  out.set(s.prepend(r).prepend(t));

            return out;
        },
        /**
         * Get the world transform matrix that transforms a point from local space into world space.
         * @method getLocalToWorldMatrix
         * @param {Matrix23} [out] - optional, the receiving vector
         * @return {Matrix23}
         */
        getLocalToWorldMatrix: function (out) {
            // todo, merge with this._worldTransform
            out = out || new Matrix23();
            this.getLocalMatrix(out);
            var t = new Fire.Matrix23();
            for (var p = this._parent; p !== null; p = p._parent) {
                out.prepend(p.getLocalMatrix(t));
            }
            return out;
        },
        /**
         * Get the inverse world transform matrix that transforms a point from world space into local space.
         * @method getWorldToLocalMatrix
         * @param {Matrix23} [out] - optional, the receiving vector
         * @return {Matrix23}
         */
        getWorldToLocalMatrix: function (out) {
            return this.getLocalToWorldMatrix(out).invert();
        },
        /**
         * Rotates this transform through point in world space by angle degrees.
         * @method rotateAround
         * @param {Vec2} point - the world point rotates through
         * @param {number} angle - degrees
         */
        rotateAround: function (point, angle) {
            var delta = this.worldPosition.subSelf(point);
            delta.rotateSelf(Math.deg2rad(angle));
            this.worldPosition = point.addSelf(delta);
            this.rotation = this._rotation + angle;
        },
        /**
         * Moves the transform in the direction and distance of translation. The movement is applied relative to the
         * transform's local space.
         * @method translate
         * @param {Vec2} translation
         */
        translate: function (translation) {
            var rotated = translation.rotate(Math.deg2rad(this._rotation));
            this.position = this._position.add(rotated, rotated);
        }
        ///**
        // * Subscribe the `onHierarchyChanged` event.
        // * When this transform or one of its parents' hierarchy changed, the `onHierarchyChanged`
        // * method will be invoked on supplied instance of Component. If you want to unsubscribe this event,
        // * you must destroy the Component.
        // * 这里不支持自定义回调，因为如果忘了反注册很容易就会内存泄漏。
        // *
        // * @method Fire.Transform#_addListener
        // * @param {Component} component - the component to be invoked.
        // * @private
        // */
        //Transform.prototype._addListener = function (component) {
        //    //if (component.entity === this.entity) {
        //        if (this._hierarchyChangedListeners) {
        //            this._hierarchyChangedListeners.push(component);
        //        }
        //        else {
        //            this._hierarchyChangedListeners = [component];
        //        }
        //    //}
        //    //else {
        //    //    Fire.error("Can not listen other entity's onHierarchyChanged event");
        //    //}
        //};

        //// 这里就算不调用，内存也不会泄露，因为component本身就会被destroy。
        //// 只不过调用了以后内存能清理的更及时。
        //Transform.prototype._removeListener = function (component) {
        //    if (this._hierarchyChangedListeners) {
        //        var idx = this._hierarchyChangedListeners.indexOf(component);
        //        this._hierarchyChangedListeners.splice(idx, 1);
        //    }
        //};

        //Transform.prototype._onHierarchyChanged = function (transform, oldParent) {
        //    // notify self listener
        //    if (this._hierarchyChangedListeners) {
        //        for (var i = this._hierarchyChangedListeners.length - 1; i >= 0; --i) {
        //            var target = this._hierarchyChangedListeners[i];
        //            if (target.isValid) {
        //                if (target.onHierarchyChanged(transform, oldParent)) {
        //                    // 目前只有一种component会终止事件，如果有多种，这里需要做分类
        //                    return;
        //                }
        //            }
        //            else {
        //                this._hierarchyChangedListeners.splice(i, 1);
        //            }
        //        }
        //    }
        //    // notify children
        //    for (var c = 0, len = this._children.length; c < len; c++) {
        //        this._children[c]._onHierarchyChanged(transform, oldParent);
        //    }
        //};
    });
    return Transform;
})();

Fire.executeInEditMode(Transform);

Fire.Transform = Transform;

var transform = Transform.prototype;

/**
 * The local x position in its parent's coordinate system
 * @property x
 * @type {number}
 * @default 0
 */
JS.getset(transform, 'x',
    function () {
        return this._position.x;
    },
    function (value) {
        if ( !isNaN(value) ) {
            this._position.x = value;
// @ifdef EDITOR
            // notify change
            this.position = this._position;
// @endif
        }
        else {
            Fire.error(ERR_NaN, 'new x');
        }
    }
);

/**
 * The local y position in its parent's coordinate system
 * @property y
 * @type {number}
 * @default 0
 */
JS.getset(transform, 'y',
    function () {
        return this._position.y;
    },
    function (value) {
        if ( !isNaN(value) ) {
            this._position.y = value;
// @ifdef EDITOR
            // notify change
            this.position = this._position;
// @endif
        }
        else {
            Fire.error(ERR_NaN, 'new y');
        }
    }
);

/**
 * The position of the transform in world space
 * @property worldPosition
 * @type {Vec2}
 * @default new Vec2(0, 0)
 */
JS.getset(transform, 'worldPosition',
    function () {
        var l2w = this.getLocalToWorldMatrix();
        return new Vec2(l2w.tx, l2w.ty);
    },
    function (value) {
        var x = value.x;
        var y = value.y;
        if ( !isNaN(x) && !isNaN(y) ) {
            if ( this._parent ) {
                var w2l = this._parent.getWorldToLocalMatrix();
                this.position = w2l.transformPoint(value);
            }
            else {
                this.position = value;
            }
        }
        else {
            Fire.error(ERR_NaN, 'xy of new worldPosition');
        }
    }
);

/**
 * The x position of the transform in world space
 * @property worldX
 * @type {number}
 * @default 0
 */
JS.getset(transform, 'worldX',
    function () {
        return this.worldPosition.x;
    },
    function (value) {
        if (!isNaN(value)) {
            if (this._parent) {
                var pl2w = this._parent.getLocalToWorldMatrix();
                var l2w = this.getLocalMatrix().prepend(pl2w);
                if (l2w.tx !== value) {
                    this._position.x = value;
                    this._position.y = l2w.ty;
                    pl2w.invert().transformPoint(this._position, this._position);
                }
            }
            else {
                this._position.x = value;
            }
// @ifdef EDITOR
            // notify change
            this.position = this._position;
// @endif
            //将来优化做好了以后，上面的代码可以简化成下面这些
            //var pos = this.worldPosition;
            //if (pos.x !== value) {
            //    pos.x = value;
            //    this.worldPosition = pos;
            //}
        }
        else {
            Fire.error(ERR_NaN, 'new worldX');
        }
    }
);

/**
 * The y position of the transform in world space
 * @property worldY
 * @type {number}
 * @default 0
 */
JS.getset(transform, 'worldY',
    function () {
        return this.worldPosition.y;
    },
    function (value) {
        if ( !isNaN(value) ) {
            if ( this._parent ) {
                var pl2w = this._parent.getLocalToWorldMatrix();
                var l2w = this.getLocalMatrix().prepend(pl2w);
                if (l2w.ty !== value) {
                    this._position.x = l2w.tx;
                    this._position.y = value;
                    pl2w.invert().transformPoint(this._position, this._position);
                }
            }
            else {
                this._position.y = value;
            }
// @ifdef EDITOR
            // notify change
            this.position = this._position;
// @endif
        }
        else {
            Fire.error(ERR_NaN, 'new worldY');
        }
    }
);

/**
 * The counterclockwise degrees of rotation in world space
 * @property worldRotation
 * @type {number}
 * @default 0
 */
JS.getset(transform, 'worldRotation',
    function () {
        if ( this._parent ) {
            return this.rotation + this._parent.worldRotation;
        }
        else {
            return this.rotation;
        }
    },
    function (value) {
        if ( !isNaN(value) ) {
            if ( this._parent ) {
                this.rotation = value - this._parent.worldRotation;
            }
            else {
                this.rotation = value;
            }
        }
        else {
            Fire.error(ERR_NaN, 'new worldRotation');
        }
    }
);

/**
 * The local x scale factor relative to the parent
 * @property scaleX
 * @type {number}
 * @default 1
 */
JS.getset(transform, 'scaleX',
    function () {
        return this._scale.x;
    },
    function (value) {
        if ( !isNaN(value) ) {
            this._scale.x = value;
// @ifdef EDITOR
            // notify change
            this.scale = this._scale;
// @endif
        }
        else {
            Fire.error(ERR_NaN, 'new scaleX');
        }
    }
);

/**
 * The local y scale factor relative to the parent
 * @property scaleY
 * @type {number}
 * @default 1
 */
JS.getset(transform, 'scaleY',
    function () {
        return this._scale.y;
    },
    function (value) {
        if ( !isNaN(value) ) {
            this._scale.y = value;
// @ifdef EDITOR
            // notify change
            this.scale = this._scale;
// @endif
        }
        else {
            Fire.error(ERR_NaN, 'new scaleY');
        }
    }
);

/**
 * The lossy scale of the transform in world space (Read Only)
 * @property worldScale
 * @type {Vec2}
 * @default new Vec2(1, 1)
 * @readOnly
 */
JS.get(transform, 'worldScale',
    function () {
        var l2w = this.getLocalToWorldMatrix();
        return l2w.getScale();
    }
);

/**
 * up direction in world space, point to the y(green) axis
 * @property up
 * @type {Vec2}
 */
JS.getset(transform, 'up',
    function () {
        return (new Vec2(0.0, 1.0)).rotateSelf(Math.deg2rad(this.worldRotation));
    },
    function (value) {
        if (value.x === 0.0 && value.y === 0.0) {
            Fire.warn("Can't get rotation from zero vector");
            return;
        }
        var radians = Math.atan2(value.y, value.x) - Math.HALF_PI;
        this.worldRotation = Math.rad2deg(radians);
    }
);

/**
 * right direction in world space, point to the x(red) axis
 * @property right
 * @type {Vec2}
 */
JS.getset(transform, 'right',
    function () {
        return (new Vec2(1.0, 0.0)).rotateSelf(Math.deg2rad(this.worldRotation));
    },
    function (value) {
        if (value.x === 0.0 && value.y === 0.0) {
            Fire.warn("Can't get rotation from zero vector");
            return;
        }
        var radians = Math.atan2(value.y, value.x);
        this.worldRotation = Math.rad2deg(radians);
    }
);
