var EventListeners = (function () {
    /**
     * @module JS
     */

    /**
     * Extends Fire._CallbacksHandler to handle and invoke event callbacks.
     * @method EventListeners
     */
    function EventListeners () {
        Fire._CallbacksHandler.call(this);
    }
    JS.extend(EventListeners, Fire._CallbacksHandler);

    /**
     * @method invoke
     * @param {Event} event
     */
    EventListeners.prototype.invoke = function (event) {
        var list = this._callbackTable[event.type];
        if (list && list.length > 0) {
            if (list.length === 1) {
                list[0].call(event.currentTarget, event);
                return;
            }
            var endIndex = list.length - 1;
            var lastFunc = list[endIndex];
            for (var i = 0; i <= endIndex; ++i) {
                var callingFunc = list[i];
                callingFunc.call(event.currentTarget, event);
                if (event._propagationImmediateStopped || i === endIndex) {
                    break;
                }
                // 为了不每次触发消息时都创建一份回调数组的拷贝，这里需要对消息的反注册做检查和限制
                // check last one to see if any one removed
                if (list[endIndex] !== lastFunc) {          // 如果变短
                    if (list[endIndex - 1] === lastFunc) {  // 只支持删一个
                        if (list[i] !== callingFunc) {      // 如果删了前面的回调，索引不变
                            --i;
                        }
                        --endIndex;
                    }
                    else {
                        // 只允许在一个回调里面移除一个回调。如果要移除很多，只能用 event.stop(true)
                        Fire.error('Call event.stop(true) when you remove more than one callbacks in a event callback.');
                        return;
                    }
                }
            }
        }
    };

    return EventListeners;
})();
