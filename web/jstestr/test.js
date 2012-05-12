
define([
    "./queue"
], function (queue) {
    
    var global = this;
    
    /**
     * Test framework which can define and run suites of tests. Tests can be synchronous or
     * asynchronous using either futures or a callback. Test and suite before/after functions can
     * also be defined. The test framework defines a set of events which can be used to monitor the
     * tests.
     */
    var TestFramework = function (args) {
        args = args || {};
        this.suites = {};
        this.specialFunctions = {};
        this.document = args.document || document;
        this.global = args.global || global;
        this.testNodes = [];
    };
    
    
    /**
     * Define a suite of tests. There are 4 special keys in the tests objects which are reserved for
     * usage as before/after functions:
     *   "beforeSuite" executes once before all the tests of the suite.
     *   "afterSuite" executes after all the tests in a suite have executed.
     *   "beforeEach" executes before each test and shares the same context as the test itself.
     *   "afterEach" executes after each test with the same context as the test itself.
     * @param suiteName The name of the test suite. Can be any string.
     * @param tests An object of key/value pairs which define each test as well as the before/after
     * functions. The key can be any alpha numeric string and can include spaces. The value can
     * either be a function or an object. If it is an object it must contain a key named "test"
     * with a value of the test function.
     */
    TestFramework.prototype.defineSuite = function defineSuite(suiteName, tests) {
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
    
    
    /**
     * Define a single test in the specified suite with the specified name.
     * @param suiteName The name of either an existing suite or a new one.
     * @param name The name to give the test. Can be any alpha numeric string including spaces.
     * @param test The test function or object. If it is an object it must contain a key named
     * "test" with a value of the test function.
     */
    TestFramework.prototype.defineTest = function defineTest(suiteName, name, test) {
        if (!this.suites[suiteName]) {
            this.suites[suiteName] = {};
            this.onSuiteDefined(suiteName);
        }
        test = this._normalizeTest(test);
        this.suites[suiteName][name] = test;
        this.onTestDefined(suiteName, name, test);
    };
    
    
    /**
     * Run all the defined suites and their tests. The tests will execute in setTimeout calls.
     * @return Future An object which can be used to be notified of the end of the test execution.
     */
    TestFramework.prototype.runAll = function runAll() {
        this.testQueue = new queue();
        
        this._start();
        
        for (var suiteName in this.suites) {
            this._runSuite(suiteName);
        }
        
        this._end();
        
        return this.testQueue.start(this.timeout);
    };
    
    /**
     * Run all the selected suite of tests. The tests will execute in setTimeout calls.
     * @return Future An object which can be used to be notified of the end of the test execution.
     */
    TestFramework.prototype.runSuite = function runSuite(suiteName) {
        this.testQueue = new queue();
        
        this._start();
        this._runSuite(suiteName);
        this._end();
        
        return this.testQueue.start(this.suites[suiteName].timeout);
    };
    
    /**
     * Run all the selected suite of tests. The tests will execute in setTimeout calls.
     * @return Future An object which can be used to be notified of the end of the test execution.
     */
    TestFramework.prototype.runTest = function runTest(suiteName, testName) {
        this.testQueue = new queue();
        
        this._start();
        this._startSuite(suiteName);
        this._runTest(suiteName, testName);
        this._endSuite(suiteName);
        this._end();
        
        return this.testQueue.start(this.suites[suiteName][testName].timeout);
    };
    
    
    /**
     * Set the parent node for any tests which need DOM nodes.
     */
    TestFramework.prototype.setTestNodeParent = function setTestNodeParent(parentNode) {
        this.testNodeParent = parentNode;
        this.testNodeParent.innerHTML = "";
    };
    
    
    /**
     * Get a new DOM node to use in a test. This will be automatically cleaned up when the test
     * ends.
     * @param cleanup Optional argument to force early cleanup of previous test nodes. This is
     * useful for tests which need multiple test nodes and wants to clean up previously used nodes.
     * @return Node The new DOM node. It is a child of the node set with setTestNodeParent or the
     * body of the document.
     */
    TestFramework.prototype.getNewTestNode = function getNewTestNode(cleanup) {
        this._ensureTestNodeParentExists();
        if (cleanup) {
            this._cleanupTestNodes();
        }
        var node = this.document.createElement("div");
        this.testNodeParent.appendChild(node);
        this.testNodes.push(node);
        this.onNewTestNode(node);
        return node;
    };
    
    
    /**
     * Start and end events for all the suites and tests.
     */
    TestFramework.prototype.onStart = function onStart() {};
    TestFramework.prototype.onEnd = function onEnd() {};
    
    /**
     * Success and failure for indivitual tests.
     */
    TestFramework.prototype.onSuccess = function onSuccess(suiteName, testName) {};
    TestFramework.prototype.onFailure = function onFailure(suiteName, testName, error) {};
    
    /**
     * Suite start and end events.
     */
    TestFramework.prototype.onSuiteStart = function onSuiteStart(suiteName) {};
    TestFramework.prototype.onSuiteEnd = function onSuiteEnd(suiteName) {};
    
    /**
     * Test start and end events.
     */
    TestFramework.prototype.onTestStart = function onTestStart(suiteName, testName) {};
    TestFramework.prototype.onTestEnd = function onTestEnd(suiteName, testName) {};
    
    /**
     * Event fired when a new test node is created.
     */
    TestFramework.prototype.onNewTestNode = function onNewTestNode(node) {};
    TestFramework.prototype.onCleanTestNodes = function onCleanTestNodes(node) {};
    
    /**
     * Suite and test defined events. These are fired when a new test or suite is created.
     */
    TestFramework.prototype.onSuiteDefined = function onSuiteDefined(suiteName) {};
    TestFramework.prototype.onTestDefined = function onTestDefined(suiteName, testName, test) {};
    
    
    
    /**
     * Start of all test execution.
     */
    TestFramework.prototype._start = function _start() {
        this.totalTests = 0;
        this.executedTests = 0;
        this.successfulTests = 0;
        
        var self = this;
        this.testQueue.then(function startTask() {
            self.onStart();
            self.testQueue.next();
        });
    };
    
    /**
     * End of all test execution.
     */
    TestFramework.prototype._end = function _end() {
        var self = this;
        this.testQueue.then(function endTask() {
            self.onEnd();
            self.testQueue.next();
        });
    };
    
    
    /**
     * Run suite helper function. It queues up tasks for execution of all tests in the specified suite.
     */
    TestFramework.prototype._runSuite = function _runSuite(suiteName) {
        this._startSuite(suiteName);

        for (var testName in this.suites[suiteName]) {
            this._runTest(suiteName, testName);
        }

        this._endSuite(suiteName);
    };
    
    
    /**
     * Main runTest helper function. It queues up a test for execution. It also handles alot of
     * error cases and asynchronous tests.
     */
    TestFramework.prototype._runTest = function _runTest(suiteName, testName) {
        this.totalTests++;
        
        var self = this;
        this.testQueue.then(function _runTestTask() {
            var testExecutor = function testExecutor() {
                
                self.currentSuiteName = suiteName;
                self.currentTestName = testName;
                
                self.onTestStart(suiteName, testName);
                
                var test = self.suites[suiteName][testName];
                test.startTime = new Date();
                test.elapsedTime = undefined;
                test.success = undefined;
                test.error = undefined;
                
                
                if (self.pageUnderTestNode) {
                    test.document = self.pageUnderTestNode.contentDocument;
                    test.global = self.pageUnderTestNode.contentWindow;
                } else {
                    test.document = self.document;
                    test.global = self.global;
                }
                self._cleanupTestNodes();
                
                // setup an error handler on the global for this test.
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
                
                var timeout;
                
                // suite level options and callbacks (beforeEach, timeout, etc)
                var specialFunction = self.specialFunctions[suiteName];
                
                // executed when the test is done, either succesfully or in failure
                function done() {
                    clearTimeout(timeout);
                    errorHandler.remove();
                    
                    test.end = new Date();
                    test.elapsedTime = test.end.getTime() - test.start.getTime();
                    
                    self.currentSuiteName = undefined;
                    self.currentTestName = undefined;
                    self.executedTests++;
                }
                
                function success() {
                    try {
                        if (specialFunction && specialFunction.afterEach) {
                            specialFunction.afterEach.apply(test);
                        }

                        done();
                        test.success = true;
                        
                        self.successfulTests++;
                        self.onSuccess(suiteName, testName);
                        self.onTestEnd(suiteName, testName);
                        self.testQueue.next();
                        
                    } catch (e) {
                        failure(e);
                    }
                }
                
                function failure(error) {
                    try {
                        if (specialFunction && specialFunction.afterEach) {
                            specialFunction.afterEach.apply(test);
                        }
                    } catch (e) {
                        // catch, but keep going because this test is already in error
                        self.onError("Error while executing afterEach method: " + e.message);
                    }
                    
                    if (!error.message) {
                        error = {message: error};
                    }
                    
                    done();
                    test.success = false;
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
                    
                    // create a timeout that cancels the test after the specified time
                    timeout = setTimeout(function () {
                        if (test.future && test.future.cancel) {
                            test.future.cancel();
                        } else {
                            failure("Test timeout");
                        }
                    }, test.timeout || (specialFunction && specialFunction.timeout) || 2000);
                    
                    // handle sync errors, async tests, and sync success
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
    
    
    TestFramework.prototype._normalizeTest = function _normalizeTest(test) {
        if (typeof test === "function") {
            return {test: test};
        } else {
            return test;
        }
    };
    
    TestFramework.prototype._ensureTestNodeParentExists = function _ensureTestNodeParentExists() {
        if (!this.testNodeParent) {
            this.testNodeParent = this.document.createElement("div");
            this.document.body.appendChild(this.testNodeParent);
        }
    };
    
    TestFramework.prototype._cleanupTestNodes = function _cleanupTestNodes() {
        var parent = this.testNodeParent;
        this.testNodes.forEach(function (node) {
            parent.removeChild(node);
        });
        if (this.testNodes.length > 0) {
            this.onCleanTestNodes();
            this.testNodes = [];
        }
    };
    
    TestFramework.prototype.ASYNC_TEST_PATTERN = /^function\s*( [\w\-$]+)?\s*\(done\)/;
    
    TestFramework.prototype._isSpecialFunction = function _isSpecialFunction(name) {
        return name === "beforeEach" || name === "afterEach" ||
            name === "beforeSuite" || name === "afterSuite" ||
            name === "pageUnderTest" || name === "timeout";
    };
    
    TestFramework.prototype._startSuite = function _startSuite(suiteName) {
        var self = this;
        this.testQueue.then(function startSuiteTask() {
            self.onSuiteStart(suiteName);
            
            if (self.pageUnderTestNode) {
                self.testNodeParent.removeChild(self.pageUnderTestNode);
                self.pageUnderTestNode = undefined;
                self.onCleanTestNodes();
            }
            
            var specialFunction = self.specialFunctions[suiteName];
            if (specialFunction && specialFunction.pageUnderTest) {
                self.testQueue.then(function _loadPageUnderTestTask() {
                    
                    var timeout = setTimeout(function _loadError() {
                        self.testQueue.next();
                    }, 20000);
                    
                    self._ensureTestNodeParentExists();
                    self._cleanupTestNodes();
                    
                    self.pageUnderTestNode = self.document.createElement("iframe");
                    self.pageUnderTestNode.src = specialFunction.pageUnderTest;
                    self.pageUnderTestNode.onload = function _onLoad() {
                        clearTimeout(timeout);
                        self.testQueue.next();
                    };
                    self.pageUnderTestNode.className = "pageUnderTest";
                    self.testNodeParent.appendChild(self.pageUnderTestNode);
                    self.onNewTestNode();
                });
            }
            
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