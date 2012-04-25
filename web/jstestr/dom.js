
define([
    "./queue"
], function (queue) {
    
    queue.prototype.byId = function byId(id, handler, options) {
        var self = this;
        this.then(function () {
            options = options || {};
            self._query("#" + selector, self._wrapHandler(handler), options);
        });
    };
    
    queue.prototype.query = function query(selector, handler, options) {
        var self = this;
        this.then(function () {
            options = options || {};
            self._query(selector, self._wrapHandler(handler), options);
        });
    };
    
    queue.prototype._query = function _query(selector, handler, options) {
        var self = this;
        this._waitFor(function queryCondition(doneHandler) {
            options = options || {};
            
            var element;
            if (options.scopeElement) {
                element = options.scopeElement.ownerDocument.querySelector(selector);
            } else {
                element = self.document.querySelector(selector);
            }
            if (element) {
                doneHandler(element);
            }
        }, handler, options);
    };

    queue.prototype._normalizeElement = function _normalizeElement(element, handler, options) {
        if (typeof element === "string") {
            this._query(element, handler, options);
        } else {
            handler(element);
        }
    };    

    queue.prototype._findParentByType = function _findParentByType(element, type) {
        while (element.parentNode && 
                element.parentNode.tagName &&
                element.parentNode.tagName.toLowerCase() !== type) {
                
            element = element.parentNode;
        }
        return element.parentNode;
    };
    
    return queue;
});
