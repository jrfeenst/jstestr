
define([
    "./browser",
    "./Queue",
    "./Event",
    "./Mouse",
    "./Key"
], function (browser, Queue, Event) {
    
    var previousMouseDownDefaultAction = Queue.prototype.defaultActions.mousedown;
    Queue.prototype.defaultActions.mousedown = function mouseDownDefaultAction(event) {
        if (this._isFocusableElement(event.target)) {
            this._focus(event.target);
        }
        previousMouseDownDefaultAction.apply(this, arguments);
    };
    
    
    var previousBeforeType = Queue.prototype.hooks.beforeType;
    Queue.prototype.hooks.beforeType = function beforeTypeHook(string, element, options) {
        this._focus(element, options);
        previousBeforeType.apply(this, arguments);
    };
    
    var previousKeyDownDefaultAction = Queue.prototype.defaultActions.keydown;
    Queue.prototype.defaultActions.keydown = function keyDownDefaultAction (event) {
        // if (event.charCode === this._lookupCharCode(event.type, "[tab]")) {
            // todo: focus on the next element in the tab order
        // }
        previousKeyDownDefaultAction.apply(this, arguments);
    };
    
    
    Queue.prototype.eventDefaults.focus = {
        canBubble: false,
        cancelable: false
    };
    Queue.prototype.eventDefaults.blur = {
        canBubble: false,
        cancelable: false
    };
    Queue.prototype.eventDefaults.focusin = {
        canBubble: true,
        cancelable: false
    };
    Queue.prototype.eventDefaults.focusout = {
        canBubble: true,
        cancelable: false
    };
    
    Queue.prototype.defaultActions.focus = function focusDefaultAction(event) {
        event.target.focus();
    };
    
    Queue.prototype._focus = function _focus(element, options) {
        options = options || {};
        if (this.browser.needsSyntheticFocus) {
            var currentlyFocused = this.document.activeElement;
			if (currentlyFocused) {
				var event = this._createEvent("blur", currentlyFocused, options);
				this._dispatchEvent(event, currentlyFocused, options);
			}
            
            event = this._createEvent("focus", element, options);
            this._dispatchEvent(event, element, options);
        } else {
            element.focus();
        }
    };
    
    Queue.prototype._isFocusableElement = function _isFocusableElement(element) {
        var type = element.type;
        if (type && type.toLowerCase) {
            type = type.toLowerCase();
        }
        return this._isTextInputElement(element) || type === "a" || element.tabIndex >= 0;
    };
    
    
    // feature tests
    
    // Some browsers don't dispatch focus/blur events when the focus() method is called
    browser.addTest(function (node) {
        var textArea1 = node.ownerDocument.createElement("textarea");
        var textArea2 = node.ownerDocument.createElement("textarea");
        node.appendChild(textArea1);
        node.appendChild(textArea2);
        textArea1.focus();
        
        Queue.prototype.browser.needsSyntheticFocus = true;
        var focusListener = Event.on("focus", textArea2, function () {
			Queue.prototype.browser.needsSyntheticFocus = false;
        });
        textArea2.focus();
        
        focusListener.remove();
    });
    
    /*
    linkHrefJS : false,
    focusChanges : false,
    tabKeyTabs : false,
    ready : 0
    */
    
    return Queue;
});
