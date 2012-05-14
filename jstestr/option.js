
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
    
    
    var previousMouseDownDefaultAction = queue.prototype.defaultActions.mousedown;
    queue.prototype.defaultActions.mousedown = function mouseDownDefaultAction(event) {
        var element = event.target;
        if (this._isOptionElement(element)) {
            var select = this._findParentByType(element, "select");
            var optionElements = select.querySelectorAll("option");
            var i, opt;
            
            if (event.ctrlKey) {
                element.selected = !element.selected;
            } else if (event.shiftKey) {
                var started = false;
                var ended = false;
                for (i = 0; i < optionElements.length; i++) {
                    opt = optionElements[i];
                    if (opt.selected || started) {
                        started = true;
                    }
                    opt.selected = started && !ended;
                    if (opt === element) {
                        ended = true;
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
        
        if (select && (event.keyCode === this._lookupKeyCode(event.type, "[up]") ||
                event.keyCode === this._lookupKeyCode(event.type, "[down]"))) {
            
            var optionElements = select.querySelectorAll("option");
            
            var i, firstSelected, lastSelected;
            for (i = 0; i < optionElements.length; i++) {
                if (firstSelected === undefined && optionElements[i].selected) {
                    firstSelected = i;
                }
                if (optionElements[i].selected) {
                    lastSelected = i;
                }
            }
            
            var activeSelected = select.selectedIndex === firstSelected ? lastSelected : firstSelected;
            
            var element, lastElement;
            if (event.keyCode === this._lookupKeyCode(event.type, "[up]")) {
                element = optionElements[activeSelected - 1];
            } else {
                element = optionElements[activeSelected + 1];
            }
            
            if (element) {
                if (event.shiftKey) {
                    optionElements[activeSelected].selected = !element.selected;
                    element.selected = true;
                } else {
                    for (i = 0; i < optionElements.length; i++) {
                        if (optionElements[i] === element) {
                            select.selectedIndex = i;
                        }
                        //optionElements[i].selected = optionElements[i] === element;
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
