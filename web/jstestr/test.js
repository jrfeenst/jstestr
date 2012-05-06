
define([
    "./queue"
], function (queue) {
    
    var global = this;
    
    var TestFramework = function (args) {
        args = args || {};
        this.suites = {};
        this.specialFunctions = {};
        this.document = args.document || document;
        this.global = args.global || global;
    };
    
    
    TestFramework.prototype._normalizeTest = function _normalizeTest(test) {
        if (typeof test === "function") {
            return {test: test};
        } else {
            return test;
        }
    };
    
    TestFramework.prototype.defineSuite = function defineSuite(suiteName, testsOrConfig, tests) {
        if (!tests) {
            tests = testsOrConfig;
            testsOrConfig = {};
        }
        for (var name in tests) {
            if (this._isSpecialFunction(name)) {
                if (!this.specialFunctions[suiteName]) {
                    this.specialFunctions[suiteName] = {};
                }
                this.specialFunctions[suiteName][name] = tests[name];        
            } else {
                this.defineTest(suiteName, name, tests[name]);
            }
        }
    };
    
    TestFramework.prototype.defineTest = function defineTest(suiteName, name, test) {
        if (!this.suites[suiteName]) {
            this.suites[suiteName] = {};
            this.onSuiteDefined(suiteName);
        }
        test = this._normalizeTest(test);
        this.suites[suiteName][name] = test;
        this.onTestDefined(suiteName, name, test);
    };
    
    TestFramework.prototype.runAll = function runAll() {
        this.testQueue = new queue();
        
        var self = this;
        this.testQueue.then(function startTask() {
            self.onStart(suiteName);
            self.testQueue.next();
        });
        
        for (var suiteName in this.suites) {
            this._startSuite(suiteName);
            
            for (var testName in this.suites[suiteName]) {
                this._runTest(suiteName, testName);
            }
            
            this._endSuite(suiteName);
        }
        
        this.testQueue.then(function endTask() {
            self.onEnd(suiteName);
            self.testQueue.next();
        });
        
        return this.testQueue.start(this.suites[suiteName].timeout);
    };
    
    TestFramework.prototype.setTestNodeParent = function setTestNodeParent(parentNode) {
        this.testNodeParent = parentNode;
    };
    
    TestFramework.prototype.getNewTestNode = function getNewTestNode(cleanup) {
        if (!this.testNodeParent) {
            this.testNodeParent = this.document.createElement("div");
            this.document.body.appendChild(this.testNodeParent);
        }
        if (cleanup) {
            this._cleanupTestNodes();
        }
        var node = this.document.createElement("div");
        this.testNodeParent.appendChild(node);
        return node;
    };
    
    TestFramework.prototype._cleanupTestNodes = function _cleanupTestNodes() {
        if (this.testNodeParent) {
            this.testNodeParent.innerHTML = "";
        }
    };
    
    TestFramework.prototype.ASYNC_TEST_PATTERN = /^function\s*( [\w\-$]+)?\s*\(done\)/;
    
    TestFramework.prototype._runTest = function _runTest(suiteName, testName) {
        var self = this;
        this.testQueue.then(function _runTestTask() {
            var testExecutor = function testExecutor() {
                var start = new Date();
                var test = self.suites[suiteName][testName];
                
                var specialFunction = self.specialFunctions[suiteName];
                
                self.currentSuiteName = suiteName;
                self.currentTestName = testName;
                
                self.onTestStart(suiteName, testName);
                
                test.startTime = start;
                test.elapsedTime = undefined;
                test.success = undefined;
                test.error = undefined;
                
                
                var errorHandler = registerErrorHandler(self.global, function (ev) {
                    var message = ev.message + ", " + ev.filename + "@" + ev.lineno;
                    if (test.future) {
                        test.future.cancel(message);
                    } else if (self.ASYNC_TEST_PATTERN.test(test.test.toString())) {
                        failure(message);
                    } else {
                        test.error = message;
                    }
                });
                
                
                var done = function done(success) {
                    var end = new Date();
                    test.elapsedTime = end.getTime() - start.getTime();
                    test.success = success;
                    
                    self.currentSuiteName = undefined;
                    self.currentTestName = undefined;
                    
                    self._cleanupTestNodes();
                    errorHandler.remove();
                }
                
                var success = function success() {
                    try {
                        if (specialFunction && specialFunction.afterEach) {
                            specialFunction.afterEach.apply(test);
                        }

                        done(true);
                        self.onSuccess(suiteName, testName);
                        self.onTestEnd(suiteName, testName);
                        self.testQueue.next();
                        
                    } catch (e) {
                        failure(e);
                    }
                }
                
                var failure = function failure(error) {
                    try {
                        if (specialFunction && specialFunction.afterEach) {
                            specialFunction.afterEach.apply(test);
                        }
                    } catch (e) {
                        self.onError("Error while executing afterEach method: " + e.message);
                    }
                    
                    if (!error.message) {
                        error = {message: error};
                    }
                    
                    done(false);
                    test.error = error;
                    self.onFailure(suiteName, testName, error);
                    self.onTestEnd(suiteName, testName);
                    self.testQueue.next();
                }
                
                try {
                    
                    if (specialFunction && specialFunction.beforeEach) {
                        specialFunction.beforeEach.apply(test);
                    }
                    
                    var runner;
                    if (test.test.name) {
                        runner = test.test;
                    } else {
                        // create a wrapper function with the testName as the name of the function so
                        // that the test function shows up in the stack trace
                        eval("runner = function " + testName.replace(/ /g, "_") +
                            "(done) { return test.test(done); };");
                    }
                    
                    var doneCallback = function doneCallback(error) {
                        if (error === true || error === undefined) {
                            success();
                        } else {
                            failure(error);
                        }
                    };
                    doneCallback.wrap = function (func) {
                        return function () {
                            try {
                                func.apply(this, arguments);
                                success();
                            } catch (e) {
                                failure(e);
                            }
                        };
                    }
                    
                    test.future = runner(doneCallback);
                    
                    if (test.error) {
                        failure(test.error);
                    } else if (test.future && test.future.then) {
                        test.future.then(success, failure);
                    } else if (!self.ASYNC_TEST_PATTERN.test(test.test.toString())) {
                        success();
                    }
                } catch (e) {
                    failure(e);
                }
            };
            
            if (self.runSync) {
                testExecutor();
            } else {
                setTimeout(testExecutor, 0);
            }
        });
    };
    
    TestFramework.prototype._isSpecialFunction = function _isSpecialFunction(name) {
        return name === "beforeEach" || name === "afterEach" ||
            name === "beforeSuite" || name === "afterSuite";
    };
    
    TestFramework.prototype._startSuite = function _startSuite(suiteName) {
        var self = this;
        this.testQueue.then(function startSuiteTask() {
            self.onSuiteStart(suiteName);
            
            var specialFunction = self.specialFunctions[suiteName];
            if (specialFunction && specialFunction.beforeSuite) {
                specialFunction.context = {};
                specialFunction.beforeSuite.apply(specialFunction.context);
            }
            
            self.testQueue.next();
        });
    };
    
    TestFramework.prototype._endSuite = function _endSuite(suiteName) {
        var self = this;
        this.testQueue.then(function endSuiteTask() {
            
            var specialFunction = self.specialFunctions[suiteName];
            if (specialFunction && specialFunction.afterSuite) {
                specialFunction.context = specialFunction.context || {};
                specialFunction.afterSuite.apply(specialFunction.context);
            }
            
            self.onSuiteEnd(suiteName);
            self.testQueue.next();
        });
    };
    
    
    TestFramework.prototype.onStart = function onStart() {};
    TestFramework.prototype.onEnd = function onEnd() {};
    
    TestFramework.prototype.onSuccess = function onSuccess(suiteName, testName) {};
    TestFramework.prototype.onFailure = function onFailure(suiteName, testName, error) {};
    
    TestFramework.prototype.onSuiteStart = function onSuiteStart(suiteName) {};
    TestFramework.prototype.onSuiteEnd = function onSuiteEnd(suiteName) {};
    
    TestFramework.prototype.onTestStart = function onTestStart(suiteName, testName) {};
    TestFramework.prototype.onTestEnd = function onTestEnd(suiteName, testName) {};
    
    TestFramework.prototype.onSuiteDefined = function onSuiteDefined(suiteName) {};
    TestFramework.prototype.onTestDefined = function onTestDefined(suiteName, testName, test) {};
    
    
    // normalize the indentation of the function to strip out extra indentation in the source code
    TestFramework.prototype._formatFunction = function _formatFunction(func) {
        var lines = func.toString().split("\n");
        var numLines = lines.length;
        if (numLines) {
            var offset = 0;
            while (offset < lines[numLines - 1].length && lines[numLines - 1].charAt(offset) === " ") {
                offset++;
            }
        }
        return lines.join("\n").replace(new RegExp("\n[ ]{" + offset + "}", "g"), "\n");
    };
    
    
    var errorHandlers = [];
    global.onerror = function (error, fileName, lineNumber) {
        if (typeof error === "string") {
            error = {
                message: error,
                filename: fileName,
                lineno: lineNumber
            };
        }
        if (errorHandlers.length > 0) {
            errorHandlers[errorHandlers.length - 1](error);
        }
    };
    
    function registerErrorHandler(global, handler) {
        errorHandlers.push(handler);
        return {
            remove: function () {
                var i = errorHandlers.indexOf(handler);
                errorHandlers.splice(i, 1);
            }
        }
    }
    
    
    var testModule = new TestFramework();
    testModule.Framework = TestFramework;
    
    if (!global.console) {
        global.console = {
            log: function () {},
            info: function () {},
            error: function () {}
        };
    }
    
    var oldLog = global.console.log;
    var oldInfo = global.console.info;
    var oldError = global.console.error;
    
    TestFramework.prototype.doLog = function () {
        oldLog.apply(global.console, arguments);
    };
    
    TestFramework.prototype.doInfo = function () {
        oldInfo.apply(global.console, arguments);
    };
    
    TestFramework.prototype.doError = function () {
        oldError.apply(global.console, arguments);
    };
    
    
    testModule.onLog = function () {};
    testModule.onInfo = function () {};
    testModule.onError = function () {};
    
    global.console.log = function () {
        testModule.onLog.apply(testModule, arguments);
    };
    
    global.console.info = function () {
        testModule.onInfo.apply(testModule, arguments);
    };
    
    global.console.error = function () {
        testModule.onError.apply(testModule, arguments);
    };
    
    return testModule;
});