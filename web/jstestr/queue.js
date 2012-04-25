
define([], function () {
    
    var queue = function (args) {
        this.document = args.document || document;
        this.timeout = args.timeout || 10000;
        this._queue = [];
    };
    
    queue.prototype.hooks = {};
    queue.prototype.browser = {};
    
    /**
     * Add a function to be called at the end of the queue.
     * @param func The function to be called. This function must call <code>next</code> when it is
     * done.
     */
    queue.prototype.then = function then(func) {
        if (this.running) {
            this._queue.unshift(func);
        } else {
            this._queue.unshift(func);
        }
    };

    /**
     * Call the next function in the queue.
     * @param func Optional function to call next. This will be prepended to the queue.
     */
    queue.prototype.next = function next(func) {
        if (func) {
            this._queue.push(func);    
        }
        if (this.running) {
            if (this._queue.length > 0) {
                var childQueue = new queue(this);
                
                var self = this;
                childQueue.onSuccess = function () {
                    childQueue.onSuccess = null;
                    childQueue.onFailure = null;
                    self.next();
                };
                childQueue.onFailure = function (message) {
                    childQueue.onSuccess = null;
                    childQueue.onFailure = null;
                    // propogate failures
                    self.done(false, message);
                };
                
                try {
                    this._queue.pop().call(this, childQueue);
                } catch (e) {
                    childQueue.done(false, e.message);
                }
            } else {
                this.done(true);
            }
        }
    };

    /**
     * Start processing the queue of tasks.
     */
    queue.prototype.start = function start(timeout, onSuccess, onFailure) {
        this.timeout = timeout === undefined ? this.timeout : timeout;
        
        if (onSuccess) {
            this.onSuccess = onSuccess;
        }
        if (onFailure) {
            this.onFailure = onFailure;
        }
        
        var self = this;
        this._testTimeout = setTimeout(function testTimeout() {
            self.done(false, "Test failed due to timeout after " + self.timeout + "ms");
        }, this.timeout);
        this.running = true;
        
        this.next();
    };

    /**
     * Called when the queue is done being processed.
     */
    queue.prototype.done = function done(result, message) {
        clearTimeout(this._testTimeout);
        this._queue = []; // reset the queue
        this.running = false;
        if (result) {
            if (this.onSuccess) {
                this.onSuccess(message);
            }
        } else {
            if (this.onFailure) {
                this.onFailure(message);
            }
        }
    };
    
    /**
     * Delay the execution by a specified amount of time.
     * @param timeout Timeout in milliseconds.
     * @param handler Function to be called after the timeout.
     */
    queue.prototype.delay = function delay(timeout, handler) {
        var self = this;
        this.then(function delayAction() {
            setTimeout(self._wrapHandler(handler), timeout);
        });
    };
    
    
    queue.prototype.waitFor = function waitFor(condition, handler, options) {
        var self = this;
        this.then(function () {
            options = options || {};
            self._waitFor(condition, self._wrapHandler(handler), options);
        });
    };
    
    queue.prototype._waitFor = function _waitFor(condition, handler, options) {
        var pollingDelay = options.pollingDelay || 50;
        var timeout = options.timeout || 10000;
        
        var start = (new Date()).getTime();
        var args;
        
        var self = this;
        var checkCondition = function checkCondition() {
            condition(function () {
                args = arguments;
            });
            
            if (args) {
                handler.apply(this, args);
            } else if ((new Date()).getTime() - start < timeout) {
                setTimeout(function () {
                    checkCondition();
                }, pollingDelay);
            } else {
                self.done(false, "Timeout waiting for condition.");
            }
        };
        checkCondition();
    };


    queue.prototype._wrapHandler = function _wrapHandle(handler) {
        var self = this;
        return function () {
            try {
                handler && handler.apply(self, arguments);
            } catch (e) {
                self.done(false, e.message);
                return;
            }
            self.next();
        };
    };
    
    queue.prototype._mixin = function _mixin(dest, source) {
        for (var key in source) {
            if (!(source[key] instanceof Function) && key !== "_queue" && key !== "_parent") {
                dest[key] = source[key];
            }
        }
    }
    
    return queue;
});
