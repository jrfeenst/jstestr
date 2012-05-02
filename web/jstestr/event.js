
define([
    "./queue"
], function (queue) {
    
    queue.prototype.eventDefaults = {};
    queue.prototype.eventDefaults.generic = {
        canBubble: true,
        cancelable: true
    };
    
    queue.prototype._createEvent = function _createEvent(type, element, options, defaults) {
        options = options || {};
        defaults = defaults || this.eventDefaults.type || this.eventDefaults.generic;
        var event = element.ownerDocument.createEvent("Event");
        event.initEvent(
            type,
            "canBubble" in options ? options.canBubble : defaults.canBubble,
            "cancelable" in options ? options.cancelable : defaults.cancelable
            );
        return event;
    };
    
    queue.prototype.defaultActions = {};
    queue.prototype._dispatchEvent = function _dispatchEvent(event, element, options, defaultAction) {
        if (!element) {
            this.done(false, "No element available to dispatch event to");
        } else if (!event) {
            this.done(false, "No event to dispatch");
        } else {
            event.synthetic = true;
            var result = element.dispatchEvent(event) === true && !event.defaultPrevented;
            if (result || !event.cancelable) {
                if (defaultAction) {
                    defaultAction.apply(this, [event]);
                } else if (this.defaultActions[event.type]) {
                    this.defaultActions[event.type].apply(this, [event]);
                }
            }
        }
    };
    
    queue._callHandler = function _callHandler(handler, scope, args) {
        if (typeof handler === "string") {
            return scope[handler].apply(scope, args);
        } else {
            return handler.apply(scope, args);
        }
    };
    
    queue.on = function on(type, element, handler, scope) {
        element.addEventListener(type, function queueOnHandler() {
            return queue._callHandler(handler, scope, arguments);
        }, false);
    };
    
    queue.prototype.on = function on(type, element, handler, scope) {
        var self = this;
        queue.on(type, element, function onHandler() {
            try {
                return queue._callHandler(handler, scope, arguments);
            } catch (e) {
                self.done(false, e);
            }
        });
    };
    
    return queue;
});
