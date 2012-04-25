
define([
    "./queue",
    "./event",
    "./mouse",
    "./key",
    "./focus"
], function (queue) {
    
    queue.prototype.eventDefaults.change = {
        canBubble: true,
        cancelable: true
    };
    
    var previousMouseClickDefaultAction = queue.prototype.defaultActions.click;
    queue.prototype.defaultActions.click = function clickDefaultAction(event) {
        if (this._needsChangeEvent) {
            var select = this._findParentByType(event.target, "select");
            var change = this._createEvent("change", select);
            this._dispatchEvent(change, select);
            this._needsChangeEvent = false;
        }
        previousMouseClickDefaultAction.apply(this, arguments);
    };
    
    
    var previousMouseDownDefaultAction = queue.prototype.defaultActions.mouseDown;
    queue.prototype.defaultActions.mouseDown = function mouseDownDefaultAction(event) {
        var element = event.target;
        if (this._isOptionElement(element)) {
            var select = this._findParentByType(element, "select");
            var optionElements = select.querySelectorAll("option");
            var i, opt;
            
            if (event.ctrlKey) {
                element.selected = true;
            } else if (event.shiftKey) {
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
            this._needsChangeEvent = true;
        }
        previousMouseDownDefaultAction.apply(this, arguments);
    };
    
    
    var previousKeyDownDefaultAction = queue.prototype.defaultActions.keydown;
    queue.prototype.defaultActions.keydown = function keyDownDefaultAction(event) {
        var select = event.target;
        
        if (select && (event.charCode === this._lookupCharCode(event.type, "[up]") ||
                event.charCode === this._lookupCharCode(event.type, "[down]"))) {
            
            var optionElements = select.querySelectorAll("option");
            
            var element;
            if (event.charCode === this._lookupCharCode(event.type, "[up]")) {
                element = optionElements[select.selectedIndex - 1];
            } else {
                element = optionElements[select.selectedIndex + 1];
            }
            
            if (element) {
                if (event.shiftKey) {
                    element.selected = element.selected ? false : true;
                } else {
                    for (var i = 0; i < optionElements.length; i++) {
                        optionElements[i].selected = optionElements[i] === element;
                    }
                }
                var change = this._createEvent("change", select);
                this._dispatchEvent(change, select);
            }
        }
        previousKeyDownDefaultAction.apply(this, arguments);
    };
    
    queue.prototype._isSelectElement = function _isSelectElement(element) {
        return "select" === element.tagName.toLowerCase();
    };
    
    queue.prototype._isOptionElement = function _isOptionElement(element) {
        return "option" === element.tagName.toLowerCase();
    };
    
    return queue;
});
