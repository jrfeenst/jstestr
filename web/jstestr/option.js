
define([
    "./queue",
    "./mouse",
    "./key",
    "./focus"
], function (queue) {
    
    var previousMouseClick = queue.prototype._click;
    queue.prototype._click = function _click(element, options) {
        if (this._isOptionElement(element)) {
            this._changeOption(element, options);
        } else {
            previousMouseClick.apply(this, arguments);
        }
    };
    
    
    var previousKeyDownDefaultAction = queue.prototype._keyDownDefaultAction;
    queue.prototype._keyDownDefaultAction = function _keyDownDefaultAction (event) {
        if (event.charCode === this._lookupCharCode("[tab]")) {
            this._focus(event.target);
        }
        previousKeyDownDefaultAction.apply(this, arguments);
    };
    
    
    queue.prototype._changeOption = function _changeOption(element, options) {
        var select = this._findParentByType(element, "select");
        
        var defaultAction = function (event) {
            var optionElements = select.querySelectorAll("option");
            var i, opt;

            if (options.ctrlKey) {
                element.selected = true;
            } else if (options.shiftKey) {
                var started = false;
                for (i = 0; i < optionElements.length; i++) {
                    opt = optionElements[i];
                    if (opt.selected || started) {
                        started = true;
                    }
                    if (started) {
                        opt.selected = true;
                    } else {
                        opt.selected = false;
                    }
                    if (opt === element) {
                        started = false;
                    }
                }
            } else {
                for (i = 0; i < optionElements.length; i++) {
                    optionElements[i].selected = optionElements[i] === element;
                }
            }
        }
        
        var change = this._createEvent("change", element, options, this._changeDefaults);
        if (!select.multiline) {
            this._click(select, options);
            this._dispatchEvent(change, select, defaultAction, options);
        } else {
            this._mouseDown(element, options);
            this._focus(element, options);
            this._mouseUp(element, options);
            this._dispatchEvent(change, select, defaultAction, options);
            this._mouseClick(element, options);
        }
    };
    
    queue.prototype._changeDefaults = {
        canBubble: true,
        cancelable: true
    };
    
    queue.prototype._isOptionElement = function _isOptionElement(element) {
        return "option" === element.tagName.toLowerCase();
    };
    
    return queue;
});
