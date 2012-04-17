
define([
    "./queue"
], function (queue) {
    
    queue.prototype._eventDefaults = {
        canBubble: true,
        cancelable: true
    };
    
    queue.prototype._createEvent = function _createEvent(type, element, options, defaults) {
        defaults = defaults || this._eventDefaults;
        var event = element.ownerDocument.createEvent("Event");
        event.initEvent(
            type,
            "canBubble" in options ? options.canBubble : defaults.canBubble,
            "cancelable" in options ? options.cancelable : defaults.cancelable
            );
        return event;
    };


    queue.prototype._dispatchEvent = function _dispatchEvent(event, element, defaultAction, options) {
        var el = element || this.element;
        if (!el) {
            this.done(false, "No element available to dispatch event to");
        } else if (!event) {
            this.done(false, "No event to dispatch");
        } else {
            event.synthetic = true;
            var result = el.dispatchEvent(event) && !event.defaultPrevented;
            if ((result || !event.cancelable) && defaultAction) {
                defaultAction.apply(this, [event]);
            }
        }
    };

    return queue;
}());
