
define([
    "./queue",
    "./event"
], function (queue) {
    
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
    
    queue.prototype.move = function move(from, to, handler, options) {
        this.then(function _moveTask(testr) {
            options = options || {};
            
            var moveDelay = options.moveDelay || 5;
            
            var start = testr._normalizeElementPoint(from);
            var end = testr._normalizeElementPoint(to);
            if (!end.element) {
                end.element = start.element;
            }
            
            testr._normalizeElement(start.element, function (elementFrom) {
                testr._normalizeElement(end.element, function (elementTo) {

                    var moveHandler = function (x, y) {
                        return function _moveHandler() {
                            var moveOptions = testr._shallowClone(options);
                            moveOptions.clientX = x;
                            moveOptions.clientY = y;
                            testr._mouseMove(testr.document.elementFromPoint(x, y), moveOptions);
                        };
                    };
                    
                    start.x = elementFrom.getBoundingClientRect().left + (start.x || 0);
                    start.y = elementFrom.getBoundingClientRect().top + (start.y || 0);
                    start.element = elementFrom;
                    
                    end.x = elementTo.getBoundingClientRect().left + (end.x || 0);
                    end.y = elementTo.getBoundingClientRect().top + (end.y || 0);
                    end.element = elementTo;
                    
                    var distX = end.x - start.x;
                    var distY = end.y - start.y;
                    var distance = Math.sqrt(Math.pow(distX, 2) + Math.pow(distY, 2));
                    
                    for (var i = 0; i < distance; i += 3) {
                        
                        var x = start.x + i / distance * distX;
                        var y = start.y + i / distance * distY;
                        
                        testr.delay(moveDelay, moveHandler(x, y));
                    }
                    
                    testr.delay(moveDelay, moveHandler(end.x, end.y));
                    
                    testr.then(testr._wrapHandler(handler));
                    testr.start();

                }, options);
            }, options);
        });
    };

	
    queue.prototype.drag = function drag(from, to, handler, options) {
        this.then(function _dragTask(testr) {
            options = options || {};
            
            var moveDelay = options.moveDelay || 5;
            
            var start = testr._normalizeElementPoint(from);
            var end = testr._normalizeElementPoint(to);
            if (!end.element) {
                end.element = start.element;
            }
            
            testr._normalizeElement(start.element, function (elementFrom) {
                testr._normalizeElement(end.element, function (elementTo) {
                    
                    start.x = elementFrom.getBoundingClientRect().left + (start.x || 0);
                    start.y = elementFrom.getBoundingClientRect().top + (start.y || 0);
                    start.element = elementFrom;

                    var downOptions = testr._shallowClone(options);
                    downOptions.clientX = start.x;
                    downOptions.clientY = start.y;
                    testr._mouseDown(elementFrom, downOptions);

                    start.x -= elementFrom.getBoundingClientRect().left;
                    start.y -= elementFrom.getBoundingClientRect().top;
                    testr.move(start, end, undefined, options);
                    
                    testr.delay(moveDelay, function () {

                        end.x = elementTo.getBoundingClientRect().left + (end.x || 0);
                        end.y = elementTo.getBoundingClientRect().top + (end.y || 0);
                        end.element = elementTo;

                        var upOptions = testr._shallowClone(options);
                        upOptions.clientX = end.x;
                        upOptions.clientY = end.y;
                        testr._mouseUp(elementTo, upOptions);
                    });

                    testr.then(testr._wrapHandler(handler));
                    testr.start();

                }, options);
            }, options);
        });
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
        var x = element.getBoundingClientRect().left;
        var y = element.getBoundingClientRect().top;
        
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
        queue.prototype.browser = queue.prototype.browser || {};
        
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
