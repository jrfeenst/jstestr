
define([
    "./Queue"
], function (Queue) {
    
    Queue.prototype.eventDefaults = {};
    Queue.prototype.eventDefaults.generic = {
        canBubble: true,
        cancelable: true
    };
    
    Queue.prototype._createEvent = function _createEvent(type, element, options, defaults) {
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
    
    Queue.prototype.defaultActions = {};
    Queue.prototype._dispatchEvent = function _dispatchEvent(event, element, options, defaultAction) {
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
    
    Queue._callHandler = function _callHandler(handler, scope, args) {
        if (typeof handler === "string") {
            return scope[handler].apply(scope, args);
        } else {
            return handler.apply(scope, args);
        }
    };
    
    Queue.on = function on(type, element, handler, scope) {
        var listener = function queueOnHandler() {
            return Queue._callHandler(handler, scope, arguments);
        };
        
        element.addEventListener(type, listener, false);
        
        return {
            remove: function () {
                element.removeEventListener(type, listener, false);
            }
        };
    };
    
    Queue.prototype.on = function on(type, element, handler, scope) {
        var self = this;
        return Queue.on(type, element, function onHandler() {
            try {
                return Queue._callHandler(handler, scope, arguments);
            } catch (e) {
                self.done(false, e);
            }
        });
    };
    
    return Queue;
});
