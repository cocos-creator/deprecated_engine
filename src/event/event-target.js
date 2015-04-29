var EventTarget = (function () {

    /**
     * EventTarget is an object to which an event is dispatched when something has occurred.
     * Entity are the most common event targets, but other objects can be event targets too.
     *
     * Event targets are an important part of the Fireball event model.
     * The event target serves as the focal point for how events flow through the scene graph.
     * When an event such as a mouse click or a keypress occurs, Fireball dispatches an event object
     * into the event flow from the root of the hierarchy. The event object then makes its way through
     * the scene graph until it reaches the event target, at which point it begins its return trip through
     * the scene graph. This round-trip journey to the event target is conceptually divided into three phases:
     * - The capture phase comprises the journey from the root to the last node before the event target's node
     * - The target phase comprises only the event target node
     * - The bubbling phase comprises any subsequent nodes encountered on the return trip to the root of the tree
	 * See also: http://www.w3.org/TR/DOM-Level-3-Events/#event-flow
     *
     * Event targets can implement the following methods:
     *  - _getCapturingTargets
     *  - _getBubblingTargets
     *
     * @class EventTarget
     * @extends HashObject
     * @constructor
     */
    function EventTarget() {
        HashObject.call(this);

        /**
         * @property _capturingListeners
         * @type {EventListeners}
         * @default null
         * @private
         */
        this._capturingListeners = null;

        /**
         * @property _bubblingListeners
         * @type {EventListeners}
         * @default null
         * @private
         */
        this._bubblingListeners = null;
    }
    JS.extend(EventTarget, HashObject);

    /**
     * Register an callback of a specific event type on the EventTarget.
     * This method is merely an alias to addEventListener.
     *
     * @method on
     * @param {string} type - A string representing the event type to listen for.
     * @param {function} callback - The callback that will be invoked when the event is dispatched.
     *                              The callback is ignored if it is a duplicate (the callbacks are unique).
     * @param {Event} callback.param event
     * @param {boolean} [useCapture=false] - When set to true, the capture argument prevents callback
     *                              from being invoked when the event's eventPhase attribute value is BUBBLING_PHASE.
     *                              When false, callback will NOT be invoked when event's eventPhase attribute value is CAPTURING_PHASE.
     *                              Either way, callback will be invoked when event's eventPhase attribute value is AT_TARGET.
     */
    EventTarget.prototype.on = function (type, callback, useCapture) {
        useCapture = typeof useCapture !== "undefined" ? useCapture : false;
        if (!callback) {
            Fire.error('Callback of event must be non-nil');
            return;
        }
        var listeners = null;
        if (useCapture) {
            listeners = this._capturingListeners = this._capturingListeners || new EventListeners();
        }
        else {
            listeners = this._bubblingListeners = this._bubblingListeners || new EventListeners();
        }
        if ( ! listeners.has(type, callback) ) {
            listeners.add(type, callback);
        }
    };

    /**
     * Removes the callback previously registered with the same type, callback, and capture.
     * This method is merely an alias to removeEventListener.
     *
     * @method off
     * @param {string} type - A string representing the event type being removed.
     * @param {function} callback - The callback to remove.
     * @param {boolean} [useCapture=false] - Specifies whether the callback being removed was registered as a capturing callback or not.
     *                              If not specified, useCapture defaults to false. If a callback was registered twice,
     *                              one with capture and one without, each must be removed separately. Removal of a capturing callback
     *                              does not affect a non-capturing version of the same listener, and vice versa.
     */
    EventTarget.prototype.off = function (type, callback, useCapture) {
        useCapture = typeof useCapture !== "undefined" ? useCapture : false;
        if (!callback) {
            return;
        }
        var listeners = useCapture ? this._capturingListeners : this._bubblingListeners;
        if (listeners) {
            listeners.remove(type, callback);
        }
    };

    /**
     * Register an callback of a specific event type on the EventTarget, the callback will remove itself after the first time it is triggered.
     *
     * @method once
     * @param {string} type - A string representing the event type to listen for.
     * @param {function} callback - The callback that will be invoked when the event is dispatched.
     *                              The callback is ignored if it is a duplicate (the callbacks are unique).
     * @param {Event} callback.param event
     * @param {boolean} [useCapture=false] - When set to true, the capture argument prevents callback
     *                              from being invoked when the event's eventPhase attribute value is BUBBLING_PHASE.
     *                              When false, callback will NOT be invoked when event's eventPhase attribute value is CAPTURING_PHASE.
     *                              Either way, callback will be invoked when event's eventPhase attribute value is AT_TARGET.
     */
    EventTarget.prototype.once = function (type, callback, useCapture) {
        var self = this;
        var cb = function (event) {
            self.off(type, cb, useCapture);
            callback(event);
        };
        this.on(type, cb, useCapture);
    };

    ///**
    // * Checks whether the EventTarget object has any callback registered for a specific type of event.
    // *
    // * @param {string} type - The type of event.
    // * @param {boolean} A value of true if a callback of the specified type is registered; false otherwise.
    // */
    //EventTarget.prototype.hasEventListener = function (type) {};

    var cachedArray = new Array(16);
    cachedArray.length = 0;

    EventTarget.prototype._doDispatchEvent = function (event) {
        event.target = this;

        // Event.CAPTURING_PHASE
        this._getCapturingTargets(event.type, cachedArray);
        // propagate
        event.eventPhase = 1;
        var target, i;
        for (i = cachedArray.length - 1; i >= 0; --i) {
            target = cachedArray[i];
            if (target.isValid && target._capturingListeners) {
                event.currentTarget = target;
                // fire event
                target._capturingListeners.invoke(event);
                // check if propagation stopped
                if (event._propagationStopped) {
                    return;
                }
            }
        }
        cachedArray.length = 0;

        // Event.AT_TARGET
        // checks if destroyed in capturing callbacks
        if (this.isValid) {
            this._doSendEvent(event);
            if (event._propagationStopped) {
                return;
            }
        }

        if (event.bubbles) {
            // Event.BUBBLING_PHASE
            this._getBubblingTargets(event.type, cachedArray);
            // propagate
            event.eventPhase = 3;
            for (i = 0; i < cachedArray.length; ++i) {
                target = cachedArray[i];
                if (target.isValid && target._bubblingListeners) {
                    event.currentTarget = target;
                    // fire event
                    target._bubblingListeners.invoke(event);
                    // check if propagation stopped
                    if (event._propagationStopped) {
                        return;
                    }
                }
            }
        }
    };

    /**
     * Dispatches an event into the event flow. The event target is the EventTarget object upon which the dispatchEvent() method is called.
     *
     * @method dispatchEvent
     * @param {Event} event - The Event object that is dispatched into the event flow
     * @return {boolean} - returns true if either the event's preventDefault() method was not invoked,
     *                      or its cancelable attribute value is false, and false otherwise.
     */
    EventTarget.prototype.dispatchEvent = function (event) {
        this._doDispatchEvent(event);
        cachedArray.length = 0;
        var notPrevented = ! event._defaultPrevented;
        event._reset();
        return notPrevented;
    };

    /**
     * Send an event to this object directly, this method will not propagate the event to any other objects.
     *
     * @method _doSendEvent
     * @param {Event} event - The Event object that is sent to this event target.
     * @private
     */
    EventTarget.prototype._doSendEvent = function (event) {
        // Event.AT_TARGET
        event.eventPhase = 2;
        event.currentTarget = this;
        if (this._capturingListeners) {
            this._capturingListeners.invoke(event);
            if (event._propagationStopped) {
                return;
            }
        }
        if (this._bubblingListeners) {
            this._bubblingListeners.invoke(event);
        }
    };

    /**
     * Send an event to this object directly, this method will not propagate the event to any other objects.
     * The event will be created from the supplied message, you can get the "detail" argument from event.detail.
     *
     * @method emit
     * @param {string} message - the message to send
     * @param {any} [detail] - whatever argument the message needs
     */
    EventTarget.prototype.emit = function (message, detail) {
        if ( typeof message === 'string' ) {
            var event = new CustomEvent(message);
            event.detail = detail;
            this._doSendEvent(event);
        }
        else {
            Fire.error('The message must be provided');
        }
    };

    ///**
    // * Send an event to this object directly, this method will not propagate the event to any other objects.
    // *
    // * @param {Event} event - The Event object that is sent to this event target.
    // * @return {boolean} - returns true if either the event's preventDefault() method was not invoked,
    // *                      or its cancelable attribute value is false, and false otherwise.
    // */
    //EventTarget.prototype.sendEvent = function (event) {
    //    // Event.AT_TARGET
    //    event.reset();
    //    event.target = this;
    //    this._doSendEvent(event);
    //    return ! event._defaultPrevented;
    //};

    /**
     * Get all the targets listening to the supplied type of event in the target's capturing phase.
     * The capturing phase comprises the journey from the root to the last node BEFORE the event target's node.
     * The result should save in the array parameter, and MUST SORT from child nodes to parent nodes.
     *
     * Subclasses can override this method to make event propagable.
     *
     * @param {string} type - the event type
     * @param {array} array - the array to receive targets
     */
    EventTarget.prototype._getCapturingTargets = function (type, array) {
        /**
         * Subclasses can override this method to make event propagable, E.g.
         * ```
         * for (var target = this._parent; target; target = target._parent) {
         *     if (target._capturingListeners && target._capturingListeners.has(type)) {
         *         array.push(target);
         *     }
         * }
         * ```
         */
    };

    /**
     * Get all the targets listening to the supplied type of event in the target's bubbling phase.
	 * The bubbling phase comprises any SUBSEQUENT nodes encountered on the return trip to the root of the tree.
     * The result should save in the array parameter, and MUST SORT from child nodes to parent nodes.
     *
     * Subclasses can override this method to make event propagable.
     *
     * @param {string} type - the event type
     * @param {array} array - the array to receive targets
     */
    EventTarget.prototype._getBubblingTargets = function (type, array) {
        // Subclasses can override this method to make event propagable.
    };

    return EventTarget;
})();

Fire.EventTarget = EventTarget;
