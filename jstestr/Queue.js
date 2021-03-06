
define([
    "./browser"
], function (browser) {
    var global = this;
    
    var Queue = function JSTestr(args) {
        args = args || {};
        this.document = args.document || global.document;
        this.timeout = args.timeout || 10000;
        this._currentTask = 0;
        this._insertionPoint = 0;
        this._queue = [];
    };
    
    Queue.prototype.hooks = {
        onBeforeTask: function () {},
        onAfterTask: function () {}
    };

    Queue.prototype.browser = browser;
    
    /**
     * Add a function to be called at the end of the queue.
     * @param func The function to be called. This function must call <code>next</code> when it is
     * done.
     * @param cascadeFailure 
     */
    Queue.prototype.then = function then(func, cascadeFailure) {
        if (func instanceof Queue) {
            func.cascadeFailure = cascadeFailure;
        }
        this._queue.splice(this._insertionPoint, 0, func);
        this._insertionPoint++;   
    };
    
    /**
     * Delay the execution by a specified amount of time.
     * @param timeout Timeout in milliseconds.
     * @param handler Function to be called after the timeout.
     */
    Queue.prototype.delay = function delay(timeout, handler) {
        var self = this;
        this.then(function delayAction() {
            setTimeout(self._wrapHandler(handler), timeout);
        });
    };
    
    
    Queue.prototype.waitFor = function waitFor(condition, handler, options) {
        var self = this;
        this.then(function () {
            options = options || {};
            self._waitFor(condition, self._wrapHandler(handler), options);
        });
    };
    
    /**
     * Call the next function in the queue.
     * @param func Optional function to call next. This will be prepended to the queue.
     */
    Queue.prototype.next = function next(func) {
        if (func instanceof Function) {
            this.then(func);    
        }
        
        if (this.running) {
            if (this._currentTask < this._queue.length) {
                try {
                    this.hooks.onBeforeTask();
                    var taskToExecute = this._currentTask;
                    this._currentTask++;
                    this._insertionPoint = this._currentTask;
                    this._queue[taskToExecute].call(this);
                    this.hooks.onAfterTask();
                } catch (e) {
                    this.done(false, e.message);
                }
            } else {
                this.done(true);
            }
        }
    };
    
    /**
     * Start processing the queue of tasks.
     */
    Queue.prototype.start = function start(timeout) {
        this.timeout = timeout === undefined ? this.timeout : timeout;
        
        var self = this;
        this._testTimeout = setTimeout(function testTimeout() {
            self.done(false, "Test failed due to timeout after " + self.timeout + "ms");
        }, this.timeout);
        this.running = true;
        
        this.next();
        
        return this._createFuture();
    };

    /**
     * Called when the queue is done being processed.
     */
    Queue.prototype.done = function done(result, message) {
        clearTimeout(this._testTimeout);
        this._queue = []; // reset the queue
        this.running = false;
        this.result = result;
        this.message = message;
        this._signalDone();
    };
    
    /**
     * Create a future which can be used to listen for success or failure of the queue's execution
     */
    Queue.prototype._createFuture = function _createFuture() {
        var self = this;
        var future = {
            callbacks: [],
            then: function (onSuccess, onFailure) {
                future.callbacks.push({
                    onSuccess: onSuccess,
                    onFailure: onFailure
                });
                if (!self.running) {
                    self._signalDone();
                }
                return future;
            },
            cancel: function () {
                if (self.running) {
                    self.done(false, "Queue execution was cancelled.");
                }
            }
        };
        
        this.onSuccess = function onSuccess() {
            var args = Array.prototype.slice.call(arguments, 0, arguments.length);
            future.callbacks.forEach(function (callback) {
                if (callback.onSuccess) {
                    callback.onSuccess.apply(this, args);
                }
            }, this);
        };
        this.onFailure = function onFailure() {
            var args = Array.prototype.slice.call(arguments, 0, arguments.length);
            future.callbacks.forEach(function (callback) {
                if (callback.onFailure) {
                    callback.onFailure.apply(this, args);
                }
            }, this);
        };
        
        return future;
    };
    
    Queue.prototype._signalDone = function _signalDone() {
        if (this.result) {
            if (this.onSuccess) {
                this.onSuccess(this.message);
            }
        } else {
            if (this.onFailure) {
                this.onFailure(this.message);
            }
        }
    };
    
    Queue.prototype._waitFor = function _waitFor(condition, handler, options) {
        var pollingDelay = options.pollingDelay || 50;
        var timeout = options.timeout || 500;
        
        var start = (new Date()).getTime();
        
        var self = this;
        var checkCondition = function checkCondition() {
            var output, error;
            try {
                output = condition();
            } catch (e) {
                error = e;
            }
            
            if (!error) {
                handler.call(self, output);
            } else if ((new Date()).getTime() - start < timeout) {
                setTimeout(function () {
                    checkCondition();
                }, pollingDelay);
            } else {
                self.done(false, error);
            }
        };
        checkCondition();
    };
    
    
    Queue.prototype._wrapHandler = function _wrapHandle(handler) {
        var self = this;
        var args = Array.prototype.slice.call(arguments, 1, arguments.length);
        return function _wrappedHandler() {
            try {
                if (handler) {
                    handler && handler.apply(self, args.concat(Array.prototype.slice.call(arguments)));
                }
                self.next();
            } catch (e) {
                self.done(false, e);
            }
        };
    };
    
    return Queue;
});
