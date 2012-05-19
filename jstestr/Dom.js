
define([
    "./Queue"
], function (Queue) {
    
    Queue.prototype.byId = function byId(id, handler, options) {
        var self = this;
        this.then(function () {
            options = options || {};
            self._query("#" + id, self._wrapHandler(handler), options);
        });
    };
    
    Queue.prototype.query = function query(selector, handler, options) {
        var self = this;
        this.then(function () {
            options = options || {};
            self._query(selector, self._wrapHandler(handler), options);
        });
    };
    
    Queue.prototype.queryAll = function queryAll(selector, expectedCount, handler, options) {
        var self = this;
        this.then(function () {
            options = options || {};
            self._queryAll(selector, expectedCount, self._wrapHandler(handler), options);
        });
    };
    
    Queue.prototype._query = function _query(selector, handler, options) {
        return this._queryAll(selector, ">0", this._wrapWithUnpackArray(handler), options);
    };
    
    Queue.prototype._queryAll = function _queryAll(selector, expected, handler, options) {
        var expectedFunc;
        
        if (typeof expected === "string") {
            expectedFunc = this._stringElementCountComparitor(expected);
        } else if (typeof expected === "number") {
            expectedFunc = function (elements) {
                return elements.length === expected;
            };
        } else {
            expectedFunc = expected;
        }

        var self = this;
        this._waitFor(function queryAllCondition() {
            options = options || {};
            
            // 3 possible types of queries, default document, element, or custom document
            var elements;
            if (options.document) {
                elements = options.document.querySelectorAll(selector);
            } else if (options.scopeElement) {
                elements = options.scopeElement.querySelectorAll(selector);
            } else {
                elements = self.document.querySelectorAll(selector);
            }
            
            if (expectedFunc(elements)) {
                return elements;
            } else {
                var msg = "Found " + elements.length + " elements but expected " + expected +
                        " using selector: '" + selector + "'";
                if (options.document) {
                    msg += " on document: '" + options.document.location + "'";
                } else if (options.scopeElement) {
                    msg += " on element: '" + options.scopeElement + "'";
                }
                throw new Error(msg);
            }
        }, handler, options);
    };
    
    Queue.prototype._stringElementCountComparitor = function _stringElementCountComparitor(expected) {
        var i, token;
        // first we have to add spaces around all the symbols so that we can split on spaces
        var tempExpected = expected.replace(/([<>=&|])/g, " $1 ");
        // we can't just use split with the symbols because we'd lose them in the output (capture
        // isn't widely supported cross-browser)
        var rawTokens = tempExpected.split(" ");
        
        var tokens = [];
        for (i in rawTokens) {
            token = rawTokens[i].replace(/^\s+|\s+$/g, "");
            if (token.length > 0) {
                tokens.push(token);
            }
        }
        
        var errorMessage = "Illegal query count expectation string: '" + expected + "'";
        if (tokens.length < 2) {
            throw new Error(errorMessage);
        }
        
        return function _stringBasedElementCount(elements) {
            var valid = true;
            var comparison = "&";
            var num;
            for (i = 0; i < tokens.length; i += 3) {
                num = parseInt(tokens[i + 1], 10);
                if (!isNaN(num)) {
                    if (tokens[i] === "<") {
                        if (comparison === "&") {
                            valid &= elements.length < num;
                        } else {
                            valid |= elements.length < num;
                        }
                    } else if (tokens[i] === ">") {
                        if (comparison === "&") {
                            valid &= elements.length > num;
                        } else {
                            valid |= elements.length > num;
                        }
                    } else if (tokens[i] === "=") {
                        if (comparison === "&") {
                            valid &= elements.length === num;
                        } else {
                            valid |= elements.length === num;
                        }
                    } else {
                        throw new Error(errorMessage)
                    }
                } else {
                    throw new Error(errorMessage);
                }
                comparison = tokens[i + 2];
                if (comparison !== undefined && comparison !== "&" && comparison !== "|") {
                    throw new Error(errorMessage);
                }
            }
            return valid;
        };
    };
    
    Queue.prototype._wrapWithUnpackArray = function _wrapWithUnpackArray(handler) {
        return function _unpackArrayHelper() {
            // unpack the first argument out of it's array'
            arguments[0] = arguments[0][0];
            handler.apply(this, arguments);
        };
    };
    
    Queue.prototype._normalizeElement = function _normalizeElement(element, handler, options) {
        if (typeof element === "string") {
            this._query(element, handler, options);
        } else {
            handler.call(this, element);
        }
    };    
    
    Queue.prototype._findParentByType = function _findParentByType(element, type) {
        while (element.parentNode && 
                element.parentNode.tagName &&
                element.parentNode.tagName.toLowerCase() !== type) {
                
            element = element.parentNode;
        }
        return element.parentNode;
    };
    
    return Queue;
});
