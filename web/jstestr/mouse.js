
define([
    "./dom",
    "./queue",
    "./event"
], function (dom, queue) {
    
    var global = this;
    
	
    queue.prototype.click = function click(element, handler, options) {
        var self = this;
        this.then(function _clickTask() {
            options = options || {};
            
            self._normalizeElement(element, function (element) {
                self._click(element, options);
                self._wrapHandler(handler)();
            }, options);
        });
    };
	
    queue.prototype.doubleClick = function doubleClick(element, handler, options) {
        var self = this;
        this.then(function _doubleClickTask() {
            options = options || {};
            
            self._normalizeElement(element, function (element) {
                self._click(element, options);
                self._click(element, options);
                self._mouseDoubleClick(element, options);
                self._wrapHandler(handler)();
            }, options);
        });
    };
    
    queue.prototype.hover = function hover(element, handler, options) {
        var self = this;
        this.then(function _hoverTask() {
            options = options || {};
            self._normalizeElement(element, function (element) {
                self._mouseMove(element, options);
                self.delay(options.timeout || 500, self._wrapHandler(handler));
                self.next();
            });
        });
    };
    
    queue.prototype.move = function move(from, to, handler, options) {
        this.then(function _moveTask() {
            options = options || {};
            
            var moveDelay = options.moveDelay || 5;
            
            var start = this._normalizeElementPoint(from);
            var end = this._normalizeElementPoint(to);
            if (!end.element) {
                end.element = start.element;
            }
            
            this._normalizeElement(start.element, function (elementFrom) {
                this._normalizeElement(end.element, function (elementTo) {

                    var moveHandler = function (x, y) {
                        return function _moveHandler() {
                            var moveOptions = this._shallowClone(options);
                            moveOptions.clientX = x;
                            moveOptions.clientY = y;
                            this._mouseMove(this.document.elementFromPoint(x, y), moveOptions);
                        };
                    };
                    
                    var fromRect = elementFrom.getBoundingClientRect();
                    fromRect = this._normalizeRect(fromRect);
                    start.x = fromRect.left + (start.x !== undefined ? start.x : fromRect.width / 2);
                    start.y = fromRect.top + (start.y !== undefined ? start.y : fromRect.height / 2);
                    start.element = elementFrom;
                    
                    var toRect = elementTo.getBoundingClientRect();
                    toRect = this._normalizeRect(toRect);
                    end.x = toRect.left + (end.x !== undefined ? end.x : toRect.width / 2);
                    end.y = toRect.top + (end.y !== undefined ? end.y : toRect.height / 2);
                    end.element = elementTo;
                    
                    var distX = end.x - start.x;
                    var distY = end.y - start.y;
                    var distance = Math.sqrt(Math.pow(distX, 2) + Math.pow(distY, 2));
                    
                    for (var i = 0; i < distance; i += 5) {
                        var x = start.x + i / distance * distX;
                        var y = start.y + i / distance * distY;
                        this.delay(moveDelay, moveHandler.call(this, x, y));
                    }
                    
                    this.delay(moveDelay, moveHandler(end.x, end.y));
                    
                    this.then(this._wrapHandler(handler));
                    this.next();
                    
                }, options);
            }, options);
        });
    };

	
    queue.prototype.drag = function drag(from, to, handler, options) {
        this.then(function _dragTask() {
            options = options || {};
            
            var moveDelay = options.moveDelay || 5;
            
            var start = this._normalizeElementPoint(from);
            var end = this._normalizeElementPoint(to);
            if (!end.element) {
                end.element = start.element;
            }
            
            this._normalizeElement(start.element, function (elementFrom) {
                this._normalizeElement(end.element, function (elementTo) {
                    
                    var fromRect = elementFrom.getBoundingClientRect();
                    fromRect = this._normalizeRect(fromRect);
                    start.x = fromRect.left + (start.x !== undefined ? start.x : fromRect.width / 2);
                    start.y = fromRect.top + (start.y !== undefined ? start.y : fromRect.height / 2);
                    start.element = elementFrom;
                    
                    var downOptions = this._shallowClone(options);
                    downOptions.clientX = start.x;
                    downOptions.clientY = start.y;
                    this._mouseDown(elementFrom, downOptions);
                    
                    start.x -= fromRect.left;
                    start.y -= fromRect.top;
                    this.move(start, end, undefined, options);
                    
                    this.delay(moveDelay, function moveTask() {
                        
                        var toRect = elementTo.getBoundingClientRect();
                        toRect = this._normalizeRect(toRect);
                        end.x = toRect.left + (end.x !== undefined ? end.x : toRect.width / 2);
                        end.y = toRect.top + (end.y !== undefined ? end.y : toRect.height / 2);
                        end.element = elementTo;
                        
                        var upOptions = this._shallowClone(options);
                        upOptions.clientX = end.x;
                        upOptions.clientY = end.y;
                        this._mouseUp(elementTo, upOptions);
                    });
                    
                    this.then(this._wrapHandler(handler));
                    this.next();
                    
                }, options);
            }, options);
        });
    };
    
    
    queue.prototype._normalizeRect = function _normalizeRect(rect) {
        return {
            left: Math.round(rect.left),
            top: Math.round(rect.top),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
        }
    };
    
    queue.prototype._normalizeElementPoint = function _normalizeElementPoint(elementPoint) {
        var x, y, element;
        if (typeof elementPoint === "string" || elementPoint instanceof Node) {
            element = elementPoint;
        } else {
            x = elementPoint.x;
            y = elementPoint.y;
            element = elementPoint.element;
        }
        return {x: x, y: y, element: element};
    };
    

    queue.prototype._click = function _click(element, options) {
        this._mouseDown(element, options);
        this._mouseUp(element, options);
        this._mouseClick(element, options);
    };
    
    
    queue.MOUSE_BUTTON = {
        LEFT: 0,
        MIDDLE: 1,
        RIGHT: 2
    };
    
    // defaults for all mouse events, can be overriden with more specific event type defaults
    queue.prototype.eventDefaults.mouse = {
        canBubble: true,
        cancelable: true,
        view: global,
        count: 1,
        button: queue.MOUSE_BUTTON.LEFT,
        relatedTarget: null,
        ctrlKey: false,
        altKey: false,
        metaKey: false,
        shiftKey: false
    };
    
    
    queue.prototype.defaultActions.mousedown = function mouseDownDefaultAction() {};
    queue.prototype._mouseDown = function _mouseDown(element, options) {
        this._updateMouseOver(element, options);
        var event = this._createMouseEvent("mousedown", element, options);
        this._dispatchEvent(event, element, options);
    };
    
    queue.prototype.defaultActions.mouseup = function mouseUpDefaultAction() {};
    queue.prototype._mouseUp = function _mouseUp(element, options) {
        this._updateMouseOver(element, options);
        var event = this._createMouseEvent("mouseup", element, options);
        this._dispatchEvent(event, element, options);
    };
    
    queue.prototype.defaultActions.click = function mouseClickDefaultAction() {};
    queue.prototype._mouseClick = function _mouseClick(element, options) {
        this._updateMouseOver(element, options);
        var event = this._createMouseEvent("click", element, options);
        this._dispatchEvent(event, element, options);
    };
    
    queue.prototype.defaultActions.dblclick = function mouseDblClickDefaultAction() {};
    queue.prototype._mouseDoubleClick = function _mouseDoubleClick(element, options) {
        var event = this._createMouseEvent("dblclick", element, options);
        this._dispatchEvent(event, element, options);
    };
    
    queue.prototype.defaultActions.mousemove = function mouseMoveDefaultAction() {};
    queue.prototype._mouseMove = function _mouseMove(element, options) {
        this._updateMouseOver(element, options);
        var event = this._createMouseEvent("mousemove", element, options);
        this._dispatchEvent(event, element, options);
    };
    
    queue.prototype.defaultActions.mouseover = function mouseOverDefaultAction() {};
    queue.prototype._mouseOver = function _mouseOver(element, options) {
        var event = this._createMouseEvent("mouseover", element, options);
        this._dispatchEvent(event, element, options);
    };
    
    queue.prototype.defaultActions.mouseout = function mouseOutDefaultAction() {};
    queue.prototype._mouseOut = function _mouseOut(element, options) {
        var event = this._createMouseEvent("mouseout", element, options);
        this._dispatchEvent(event, element, options);
    };
    
    
    queue.prototype._updateMouseOver = function _updateMouseOver(element, options) {
        if (this._currentMouseOverElement != element) {
            if (this._currentMouseOverElement) {
                this._mouseOut(this._currentMouseOverElement, options);
                //this._mouseLeave(element, options);
            }
            this._mouseOver(element, options);
            //this._mouseEnter(element, options);
            
            this._currentMouseOverElement = element;
        }
    };
    
    
    queue.prototype._createMouseEvent = function _createMouseEvent(type, element, options) {
        var defaults = this.eventDefaults[type] || this.eventDefaults.mouse;
        var rect = element.getBoundingClientRect();
        var x = rect.left + rect.width / 2;
        var y = rect.top + rect.height / 2;
        
        var event = element.ownerDocument.createEvent("MouseEvent");
        event.initMouseEvent(
            type,
            "canBubble" in options ? options.canBubble : defaults.canBubble,
            "cancelable" in options ? options.cancelable : defaults.cancelable,
            "view" in options ? options.view : defaults.view,
            "count" in options ? options.count : defaults.count,
            "screenX" in options ? options.screenX : x,
            "screenY" in options ? options.screenY : y,
            "clientX" in options ? options.clientX : x,
            "clientY" in options ? options.clientY : y,
            "ctrlKey" in options ? options.ctrlKey : defaults.ctrlKey,
            "altKey" in options ? options.altKey : defaults.altKey,
            "shiftKey" in options ? options.shiftKey : defaults.shiftKey,
            "metaKey" in options ? options.metaKey : defaults.metaKey,
            "button" in options ? options.button : defaults.button,
            "relatedTarget" in options ? options.relatedTarget : defaults.relatedTarget
            );
        return event;
    };
    
    
    queue.prototype._shallowClone = function _shallowClone(obj) {
        var newObj = new obj.constructor();
        for (var i in obj) {
            newObj[i] = obj[i];
        }
        return newObj;
    };
    
    
    (function () {
        /*
            clickChanges : false,
            clickSubmits : false,
            mouseupSubmits: false,
            elementFromClient : true,
            elementFromPage : true,
            radioClickChanges : false,
            mouseDownUpClicks : false,
            mouseDownUpRepeatClicks : false,
            optionClickBubbles : false
        */
    }());

    return queue;
});
