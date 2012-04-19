
define([
    "./event",
    "./mouse",
    "./key"
], function (event) {
    
    var previousMouseDownDefaultAction = event.prototype._mouseDownDefaultAction;
    event.prototype._mouseDownDefaultAction = function _mouseDownDefaultAction (event) {
        if (this._isFocusableElement(event.target)) {
            this._focus(event.target);
        }
        previousMouseDownDefaultAction.apply(this, arguments);
    };
    
    
    var previousBeforeType = event.prototype._beforeType;
    event.prototype._beforeType = function _beforeType(string, element, options) {
        this._focus(element, options);
        previousBeforeType.apply(this, arguments);
    };
    
    var previousKeyDownDefaultAction = event.prototype._keyDownDefaultAction;
    event.prototype._keyDownDefaultAction = function _keyDownDefaultAction (event) {
        if (event.charCode === this._lookupCharCode("[tab]")) {
            // todo: focus on the next element in the tab order
        }
        previousKeyDownDefaultAction.apply(this, arguments);
    };
    
    
    event.prototype._focusDefaults = {
        canBubble: false,
        cancelable: false
    };
    event.prototype._blurDefaults = {
        canBubble: false,
        cancelable: false
    };
    event.prototype._focusinDefaults = {
        canBubble: true,
        cancelable: false
    };
    event.prototype._focusoutDefaults = {
        canBubble: true,
        cancelable: false
    };
    
    event.prototype._needsSyntheticFocus = true;
    event.prototype._focus = function _focus(element, options) {
        options = options || {};
        if (this._needsSyntheticFocus) {
            var currentlyFocused = this.document.activeElement;
            var event = this._createEvent("blur", currentlyFocused, options, this._blurDefaults);
            this._dispatchEvent(event, currentlyFocused, null, options);
            
            if (this._supportsFocusout) {
                event = this._createEvent("focusout", element, options, this._focusoutDefaults);
                this._dispatchEvent(event, currentlyFocused, null, options);
            }
            
            event = this._createEvent("focus", element, options, this._focusDefaults);
            this._dispatchEvent(event, element, function _focusDefaultAction() {
                element.focus();
            }, options);

            if (this._supportsFocusin) {
                event = this._createEvent("focusin", element, options, this._focusinDefaults);
                this._dispatchEvent(event, element, null, options);
            }
        } else {
            element.focus();
        }
    };
    
    event.prototype._isFocusableElement = function _isFocusableElement(element) {
        var type = element.type;
        if (type && type.toLowerCase) {
            type = type.toLowerCase();
        }
        return this._isTextInputElement(element) || type === "a" || element.tabIndex >= 0;
    };

    return event;
});
