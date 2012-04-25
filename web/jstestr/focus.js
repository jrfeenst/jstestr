
define([
    "./queue",
    "./event",
    "./mouse",
    "./key"
], function (queue) {
    
    var previousMouseDownDefaultAction = queue.prototype.defaultActions.mouseDown;
    queue.prototype.defaultActions.mouseDown = function mouseDownDefaultAction(event) {
        if (this._isFocusableElement(event.target)) {
            this._focus(event.target);
        }
        previousMouseDownDefaultAction.apply(this, arguments);
    };
    
    
    var previousBeforeType = queue.prototype.hooks.beforeType;
    queue.prototype.hooks.beforeType = function beforeTypeHook(string, element, options) {
        this._focus(element, options);
        previousBeforeType.apply(this, arguments);
    };
    
    var previousKeyDownDefaultAction = queue.prototype.defaultActions.keyDown;
    queue.prototype.defaultActions.keyDown = function keyDownDefaultAction (event) {
        if (event.charCode === this._lookupCharCode(event.type, "[tab]")) {
            // todo: focus on the next element in the tab order
        }
        previousKeyDownDefaultAction.apply(this, arguments);
    };
    
    
    queue.prototype.eventDefaults.focus = {
        canBubble: false,
        cancelable: false
    };
    queue.prototype.eventDefaults.blur = {
        canBubble: false,
        cancelable: false
    };
    queue.prototype.eventDefaults.focusin = {
        canBubble: true,
        cancelable: false
    };
    queue.prototype.eventDefaults.focusout = {
        canBubble: true,
        cancelable: false
    };
    
    queue.prototype.defaultActions.focus = function focusDefaultAction(event) {
        event.target.focus();
    };
    
    queue.prototype._focus = function _focus(element, options) {
        options = options || {};
        if (this.browser.needsSyntheticFocus) {
            var currentlyFocused = this.document.activeElement;
            var event = this._createEvent("blur", currentlyFocused, options);
            this._dispatchEvent(event, currentlyFocused, options);
            
            if (this.browser.supportsFocusout) {
                event = this._createEvent("focusout", element, options);
                this._dispatchEvent(event, currentlyFocused, options);
            }
            
            event = this._createEvent("focus", element, options);
            this._dispatchEvent(event, element, options);
            
            if (this.browser.supportsFocusin) {
                event = this._createEvent("focusin", element, options);
                this._dispatchEvent(event, element, options);
            }
        } else {
            element.focus();
        }
    };
    
    queue.prototype._isFocusableElement = function _isFocusableElement(element) {
        var type = element.type;
        if (type && type.toLowerCase) {
            type = type.toLowerCase();
        }
        return this._isTextInputElement(element) || type === "a" || element.tabIndex >= 0;
    };
    
    
    // feature test
    (function () {
        queue.prototype.browser.needsSyntheticFocus = true;
        queue.prototype.browser.supportsFocusin = true;
        queue.prototype.browser.supportsFocusout = true;
        /*
            linkHrefJS : false,
            focusChanges : false,
            tabKeyTabs : false,
            ready : 0
         */
    }());
    
    return queue;
});
