/**
 * Key codes returned by Event.keyCode. These map directly to a physical key on the keyboard.
 * @enum Fire.KeyCode
 */
Fire.KeyCode = Fire.defineEnum({
  /**
  * @property {number} Digit0 - The '0' key on the top of the alphanumeric keyboard.
  * @property {number} Digit1 - The '1' key on the top of the alphanumeric keyboard.
  * @property {number} Digit2 - The '2' key on the top of the alphanumeric keyboard.
  * @property {number} Digit3 - The '3' key on the top of the alphanumeric keyboard.
  * @property {number} Digit4 - The '4' key on the top of the alphanumeric keyboard.
  * @property {number} Digit5 - The '5' key on the top of the alphanumeric keyboard.
  * @property {number} Digit6 - The '6' key on the top of the alphanumeric keyboard.
  * @property {number} Digit7 - The '7' key on the top of the alphanumeric keyboard.
  * @property {number} Digit8 - The '8' key on the top of the alphanumeric keyboard.
  * @property {number} Digit9 - The '9' key on the top of the alphanumeric keyboard.
  * @property {number} A - 'a' key.
  */
  Digit1: 49,
  Digit2: 50,
  Digit3: 51,
  Digit4: 52,
  Digit5: 53,
  Digit6: 54,
  Digit7: 55,
  Digit8: 56,
  Digit9: 57,
  Digit0: 48,
  A: 65,
  B: 66,
  C: 67,
  D: 68,
  E: 69,
  F: 70,
  G: 71,
  H: 72,
  I: 73,
  J: 74,
  K: 75,
  L: 76,
  M: 77,
  N: 78,
  O: 79,
  P: 80,
  Q: 81,
  R: 82,
  S: 83,
  T: 84,
  U: 85,
  V: 86,
  W: 87,
  X: 88,
  Y: 89,
  Z: 90,
  /**
  * @property {number} Comma - Comma ',' key.
  * @property {number} Period - Period '.' key.
  * @property {number} Semicolon - Semicolon ';' key.
  * @property {number} Quote - Quote key '.
  * @property {number} BracketLeft - Left square bracket key '['.
  * @property {number} BracketRight - Right square bracket key '['.
  * @property {number} Backquote - Back quote key '`'.
  * @property {number} Backslash - Backslash key '\'.
  * @property {number} Minus - Minus '-' key.
  * @property {number} Equal - Equal '=' key.
  * @property {number} Alt - Alt key.
  * @property {number} Control - Control key.
  * @property {number} Shift - Shift key.
  * @property {number} Command - Command key.
  * @property {number} Slash - Slash key.
  */
  Comma: 188,
  Period: 190,
  Semicolon: 186,
  Quote: 222,
  BracketLeft: 219,
  BracketRight: 221,
  Backquote: 192,
  Backslash: 220,
  Minus: 189,
  Equals: 187,
  Alt: 18,
  Control: 17,
  Shift: 16,
  Command: 91,
  Slash: 191,
  /**
  * @property {number} Enter - Enter key.
  * @property {number} Space - Space key.
  * @property {number} Tab - Tab key.
  * @property {number} Delete - Delete key.
  * @property {number} End - End key.
  * @property {number} Home - Home key.
  * @property {number} Insert - Insert key.
  * @property {number} PageDown - PageDown key.
  * @property {number} PageUp - PageUp key.
  * @property {number} ArrowLeft - ArrowLeft key.
  * @property {number} ArrowRight - ArrowRight key.
  * @property {number} ArrowUp - ArrowUp key.
  * @property {number} ArrowDown - ArrowDown key.
  * @property {number} Escape - Escape key.
  */
  Enter: 13,
  Space: 32,
  Tab: 9,
  Delete: 46,
  End: 35,
  Home: 36,
  Insert: 45,
  PageDown: 34,
  PageUp: 33,
  ArrowDown: 40,
  ArrowLeft: 37,
  ArrowRight: 39,
  ArrowUp: 38,
  Escape: 27
});

var Input = (function () {

    /**
     * Interface into the Input system.
     * @class Input
     * @static
     * @beta
     */
    var Input = {
        _eventListeners: new EventListeners(),
        _lastTarget: null
    };

    /**
     * Returns whether the current device supports touch input
     * @property hasTouch
     * @type {boolean}
     */
    Object.defineProperty(Input, 'hasTouch', {
        get: function () {
            return !!Engine._inputContext && Engine._inputContext.hasTouch;
        }
    });

    /**
     * !#en Register an callback of a specific input event type.
     *
     * For all supported event and type, please see [Input Events](/en/scripting/input-events)
     *
     * !#zh 注册输入事件的回调方法。
     *
     * 请参考：
     * - [获取用户输入](/manual/scripting/input)
     * - [输入事件列表](/manual/scripting/input-events)
     *
     * @method on
     * @param {string} type - eg. "keydown", "click"
     * @param {function} callback
     * @param {Event} callback.param event - the input event
     * @beta
     */
    Input.on = function (type, callback) {
        if (callback) {
            this._eventListeners.add(type, callback);
        }
        else {
            Fire.error('Callback must be non-nil');
        }
    };

    /**
     * Removes the callback previously registered with the same type and callback.
     * @method off
     * @param {string} type
     * @param {function} callback
     * @beta
     */
    Input.off = function (type, callback) {
        if (callback) {
            if (! this._eventListeners.remove(type, callback)) {
                Fire.warn('Callback not exists');
            }
        }
        else {
            Fire.error('Callback must be non-nil');
        }
    };

    Input._reset = function () {
        this._eventListeners = new EventListeners();
        this._lastTarget = null;
    };

    Input._dispatchMouseEvent = function (event, inputContext) {
        var camera = inputContext.renderContext.camera || Engine._scene.camera;
        var worldMousePos = camera.screenToWorld(new Vec2(event.screenX, event.screenY));
        var target = Engine._interactionContext.pick(worldMousePos);

        // dispatch global mouse event
        event.target = target;
        this._eventListeners.invoke(event);

        if (this._lastTarget && this._lastTarget !== target) {
            // mouse leave event
            var leaveEvent = event.clone();
            leaveEvent.type = 'mouseleave';
            leaveEvent.bubbles = EventRegister.inputEvents.mouseleave.bubbles;
            this._lastTarget.dispatchEvent(leaveEvent);
        }
        if (target) {
            // dispatch mouse event
            target.dispatchEvent(event);
            // mouse enter event
            if (this._lastTarget !== target) {
                var enterEvent = event.clone();
                enterEvent.type = 'mouseenter';
                enterEvent.bubbles = EventRegister.inputEvents.mouseenter.bubbles;
                target.dispatchEvent(enterEvent);
            }
        }
        this._lastTarget = target;
    };

    Input._dispatchEvent = function (event, inputContext) {
        if (event instanceof Fire.MouseEvent) {
            this._dispatchMouseEvent(event, inputContext);
        }
        else {
            // dispatch global event
            this._eventListeners.invoke(event);
        }
    };

    return Input;
})();

Fire.Input = Input;
