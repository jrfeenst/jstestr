
define([
    "./browser",
    "./Queue"
], function (browser, Queue) {
    
    var global = this;
    var MAX_INT32 = 4294967296;
    
    if (!Function.prototype.bind) {
        Function.prototype.bind = Function.prototype.bind || function (that) {
            var fn = this;
            return function () {
                return fn.apply(that, arguments);
            };
        };
    }

    /**
     * Test framework which can define and run suites of tests. Tests can be synchronous or
     * asynchronous using either futures or a callback. Test and suite before/after functions can
     * also be defined. The test framework defines a set of events which can be used to monitor the
     * tests.
     */
    var TestFramework = function TestFramework(args) {
        args = args || {};
        this.suites = {};
        this.specialFunctions = {};
        this.document = args.document || global.document;
        this.global = args.global || global;
        this.testNodes = [];
        this.timeout = args.timeout || 10*60*1000;
        this._totalTests = 0;
        this.randomOrder = args.randomOrder || true;
        this.suiteOrder = [];
        this.testOrder = {};
        this.randSeed(args.randSeed || (Math.random() * MAX_INT32));
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
        var name;
        for (name in tests) {
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
        var i;
        if (!this.suites[suiteName]) {
            this.suites[suiteName] = {};

            i = this.randomOrder ? this.randInt() % (this.suiteOrder.length + 1) : this.suiteOrder.length;
            this.suiteOrder.splice(i, 0, suiteName);
            this.testOrder[suiteName] = [];
            this.onSuiteDefined(suiteName, i);
        }

        if (test.parameters) {
            var generated = this._generateTests(name, test);
            generated.forEach(function (gen) {
                this._defineTest(suiteName, gen.name, gen.test);
            }, this);
        } else {
            this._defineTest(suiteName, name, test);
        }
    };
    
    
    /**
     * Run all the defined suites and their tests. The tests will execute in setTimeout calls.
     * @return Future An object which can be used to be notified of the end of the test execution.
     */
    TestFramework.prototype.runAll = function runAll() {
        this._start();
        this.suiteOrder.forEach(function (suiteName) {
            this._runSuite(suiteName);
        }, this);
        this._end();
        
        return this.testQueue.start(this.timeout);
    };
    
    /**
     * Run all the selected suite of tests. The tests will execute in setTimeout calls.
     * @return Future An object which can be used to be notified of the end of the test execution.
     */
    TestFramework.prototype.runSuite = function runSuite(suiteName) {
        this._start();
        this._runSuite(suiteName);
        this._end();
        
        return this.testQueue.start();
    };

    /**
     * Run all the suites which match the pattern. The tests will execute in setTimeout calls.
     * @return Future An object which can be used to be notified of the end of the test execution.
     */
    TestFramework.prototype.runSuites = function runSuite(pattern) {
        if (typeof pattern === "string") {
            pattern = new RegExp(pattern.replace(/\*/g, ".*?"), "i");
        } else if (!(pattern instanceof RegExp)) {
            pattern = new RegExp(pattern, "i");
        }

        var suiteNames = this.suiteOrder.filter(function (suiteName) {
            return pattern.test(suiteName);
        });

        this._start();
        suiteNames.forEach(this._runSuite, this);
        this._end();
        
        return this.testQueue.start();
    };

    /**
     * Run all the selected suite of tests. The tests will execute in setTimeout calls.
     * @return Future An object which can be used to be notified of the end of the test execution.
     */
    TestFramework.prototype.runTest = function runTest(suiteName, testName) {
        this._start();
        this._startSuite(suiteName);
        this._runTest(suiteName, testName);
        this._endSuite(suiteName);
        this._end();
        
        return this.testQueue.start();
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
            this._cleanupBeforeTest();
        }
        var node = this.document.createElement("div");
        this.testNodeParent.appendChild(node);
        this.testNodes.push(node);
        this.onNewTestNode(node);
        return node;
    };
    
    /**
     * Listen to the specified event.
     */
    TestFramework.prototype.on = function on(method, func) {
        var oldMethod = this[method];
        var self = this;
        this[method] = function () {
            func.apply(self, arguments);
            oldMethod.apply(self, arguments);
        };
    };

    /**
     * Conditions used for ignoring tests.
     */
    TestFramework.prototype.conditions = browser;
    
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
    TestFramework.prototype.onIgnore = function onIgnore(suiteName, testName) {};
    
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
    TestFramework.prototype.onSuiteDefined = function onSuiteDefined(suiteName, index) {};
    TestFramework.prototype.onTestDefined = function onTestDefined(suiteName, testName, test, index) {};
    
    // Define a single test point. The test must be normalized.
    TestFramework.prototype._defineTest = function _defineTest(suiteName, name, test) {
        if (!this.suites[suiteName][name]) {
            test = this._normalizeTest(test);
            this.suites[suiteName][name] = test;

            i = this.randomOrder ? this.randInt() % (this.testOrder[suiteName].length + 1) : this.testOrder[suiteName].length;
            this.testOrder[suiteName].splice(i, 0, name);
            this.onTestDefined(suiteName, name, test, i);
            this._totalTests++;
        } else {
            this.doError("Duplicate test definition: " + suiteName + " - " + name);
        }
    };

    TestFramework.prototype._getParamNames = function _getParamNames(fn) {
        var funStr = fn.toString();
        return funStr.slice(funStr.indexOf("(") + 1, funStr.indexOf(")")).match(/([^\s,]+)/g);
    };

    // Generate a set of tests based on parameter values.
    TestFramework.prototype._generateTests = function _generateTests(namePattern, test) {
        var keys = Object.keys(test.parameters);
        var maxLen = 0;
        keys.forEach(function (key) {
            maxLen = Math.max(maxLen, test.parameters[key].length);
        });

        test = this._normalizeTest(test);

        function createTest(name, args) {
            return {
                name: name,
                test: function () {
                    return test.test.apply(this, args.concat(Array.prototype.splice.call(arguments, 0)));
                }
            };
        }

        var i, name, args, generated = [];
        for (i = 0; i < maxLen; i++) {
            // create the test name using string replacing
            name = namePattern;
            keys.forEach(function (key) {
                name = name.replace(new RegExp("\\$" + key, "g"), test.parameters[key][i]);
            });

            var parameters = this._getParamNames(test.test);
            args = parameters.map(function (key) {
                return test.parameters[key][i];
            });

            generated.push(createTest(name, args));
        }

        return generated;
    };
    
    // Start of all test execution.
    TestFramework.prototype._start = function _start() {
        this.testQueue = new Queue({timeout: this.timeout});

        this.totalTests = 0;
        this.executedTests = 0;
        this.successfulTests = 0;
        this.ignoredTests = 0;
        
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
    
    
    // Run suite helper function. It queues up tasks for execution of all tests in the specified suite.
    TestFramework.prototype._runSuite = function _runSuite(suiteName) {
        this._startSuite(suiteName);

        this.testOrder[suiteName].forEach(function (testName) {
            this._runTest(suiteName, testName);
        }, this);

        this._endSuite(suiteName);
    };
    
    // Main runTest helper function. It queues up a test for execution. It also handles alot of
    // error cases and asynchronous tests.
    TestFramework.prototype._runTest = function _runTest(suiteName, testName) {
        this.totalTests++;
        
        var self = this;
        this.testQueue.then(function _runTestTask() {
            var testExecutor = function testExecutor() {
                try {
                    var test = self._resetTest(self.suites[suiteName][testName]);

                    self.currentSuiteName = suiteName;
                    self.currentTestName = testName;
                    
                    self.onTestStart(suiteName, testName);
                    
                    // executed when the test is done, either succesfully or in failure
                    var done = self._testDone.bind(self, test);

                    var failure = self._testFailure.bind(self, test, done, suiteName, testName);
                    var success = self._testSuccess.bind(self, test, done, failure, suiteName, testName);

                    // check for ignored tests
                    var conditions = testName.match(/(?:^\/\/)(?:\{(!)?(.*?)\})?/);
                    if (conditions && (!conditions[2] || (!!conditions[1] ^ self.conditions[conditions[2]]))) {
                        test.ignored = true;
                        self.ignoredTests++;
                        done();

                        self.onIgnore(suiteName, testName);
                        self.onTestEnd(suiteName, testName);
                        self.testQueue.next();  
                        return;
                    }

                    // suite level options and callbacks (beforeEach, timeout, etc)
                    var specialFunction = self.specialFunctions[suiteName] || {};
                    test.suite = specialFunction.context;

                    if (specialFunction.beforeEach) {
                        specialFunction.beforeEach.apply(test);
                    }

                    // setup an error handler on the global for this test.
                    var globalError = self._globalErrorHandler.bind(self, test, failure);
                    test._errorHandler = registerErrorHandler(self.global, globalError);
                    
                    // Create the async test done callback
                    var doneCallback = self._doneCallback.bind(self, success, failure);
                    doneCallback.wrap = self._doneWrapper.bind(self, success, failure);

                    // Actually execute the test function
                    test.future = test.test(doneCallback);
                    
                    if (test.done) {
                        return;
                    }
                    // create a timeout that cancels the test after the specified time
                    test._timeout = setTimeout(function () {
                        if (test.future && test.future.cancel) {
                            test.future.cancel();
                        } else {
                            failure("Test timeout");
                        }
                    }, test.timeout || specialFunction.timeout || 1000);
                    
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
    
    // Reset the test's fields.
    TestFramework.prototype._resetTest = function _resetTest(test) {
        test.startTime = new Date();
        test.elapsedTime = undefined;
        test.success = undefined;
        test.error = undefined;
        test.done = false;
        test.domSnapshot = [];

        if (this.pageUnderTestNode) {
            test.document = this.pageUnderTestNode.contentDocument;
            test.global = this.pageUnderTestNode.contentWindow;
        } else {
            test.document = this.document;
            test.global = this.global;
        }
        this._cleanupBeforeTest();

        return test;
    };

    // Called when the test executes successfully.
    TestFramework.prototype._testSuccess = function _testSuccess(test, done, failure, suiteName, testName) {
        try {
            var specialFunction = this.specialFunctions[suiteName] || {};
            if (specialFunction.afterEach) {
                specialFunction.afterEach.apply(test);
            }

            done();
            
            this.onSuccess(suiteName, testName);
            this.onTestEnd(suiteName, testName);

            test.success = true;
            this.successfulTests++;

            this.testQueue.next();
        } catch (e) {
            failure(e);
        }
    };

    // Called when the test fails.
    TestFramework.prototype._testFailure = function failure(test, done, suiteName, testName, error) {
        try {
            if (this.pageUnderTestNode) {
                test.domSnapshot.push(this.pageUnderTestNode.contentDocument.innerHTML);
            }
            if (this.testNodeParent) {
                var i, node;
                for (i = 0; i < this.testNodeParent.children.length; i += 1) {
                    node = this.testNodeParent.children[i];
                    if (node.tagName.toLowerCase() === "iframe") {
                        test.domSnapshot.push(node.contentDocument.body.parentNode.innerHTML);
                    } else if (node.innerHTML) {
                        test.domSnapshot.push(node.innerHTML);
                    }
                }
            }

            var specialFunction = this.specialFunctions[suiteName] || {};
            if (specialFunction.afterEach) {
                specialFunction.afterEach.apply(test);
            }
        } catch (e) {
            // catch, but keep going because this test is already in error
            this.onError("Error while executing afterEach method: " + e.message);
        }
        
        try {
            if (!error.message) {
                error = {message: error};
            }
            
            done();
            test.success = false;
            test.error = error;
            
            this.onFailure(suiteName, testName, error);
            this.onTestEnd(suiteName, testName);
        } finally {
            this.testQueue.next();   
        }
    };

    // Called when the test is done in any situation.
    TestFramework.prototype._testDone = function _testDone(test) {
        clearTimeout(test._timeout);
        if (test._errorHandler) {
            test._errorHandler.remove();
        }
        
        test.endTime = new Date();
        test.elapsedTime = test.endTime.getTime() - test.startTime.getTime();
        test.done = true;
        
        this.currentSuiteName = undefined;
        this.currentTestName = undefined;
        this.executedTests++;
    };

    // Error handler for uncaught global exceptions.
    TestFramework.prototype._globalErrorHandler = function (test, failure, ev) {
        var message = ev.message + ", " + ev.filename + "@" + ev.lineno;
        if (test.future) {
            if (test.future.cancel) {
                test.future.cancel(message);
            }
            failure(message);
        } else if (this.ASYNC_TEST_PATTERN.test(test.test.toString())) {
            failure(message);
        } else {
            test.error = message;
        }
    };

    // Async test callback that is passed to test functions as the "done" parameter.
    TestFramework.prototype._doneCallback = function _doneCallback(success, failure, error) {
        if (error === true || error === undefined) {
            success();
        } else {
            failure(error);
        }
    };

    // Helper function to wrap async callbacks. When the function is done the test is ended.
    TestFramework.prototype._doneWrapper = function _doneWrapper(success, failure, func) {
        return function () {
            try {
                func.apply(this, arguments);
                success();
            } catch (e) {
                failure(e);
            }
        };
    };

    // Normalize the test object to contain a test field.
    TestFramework.prototype._normalizeTest = function _normalizeTest(test) {
        if (typeof test === "function") {
            return {test: test};
        } else {
            return test;
        }
    };
    
    // Make sure that a test container node exists in the DOM.
    TestFramework.prototype._ensureTestNodeParentExists = function _ensureTestNodeParentExists() {
        if (!this.testNodeParent) {
            this.testNodeParent = this.document.createElement("div");
            this.document.body.appendChild(this.testNodeParent);
        }
    };
    
    // Cleanup the test container node.
    TestFramework.prototype._cleanupBeforeTest = function _cleanupBeforeTest() {
        var parent = this.testNodeParent;
        this.testNodes.forEach(function (node) {
            parent.removeChild(node);
        });

        if (this.testNodes.length > 0) {
            this.onCleanTestNodes();
            this.testNodes = [];
        }
    };
    
    TestFramework.prototype.ASYNC_TEST_PATTERN = /^function\s*?( [\w\-$]+)?\s*\((\s*\w+\s*,\s*)*done\)/;
    
    // Special property keys and functions which represent special values.
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
            
            var specialFunction = self.specialFunctions[suiteName] || {};
            if (specialFunction.pageUnderTest) {
                self.testQueue.then(function _loadPageUnderTestTask() {
                    
                    var timeout = setTimeout(function _loadError() {
                        self.doError("Unable to load page under test: " + specialFunction.pageUnderTest);
                        self.testQueue.next();
                    }, 20000);
                    
                    self._ensureTestNodeParentExists();
                    self._cleanupBeforeTest();
                    
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
            
            try {
                if (specialFunction.beforeSuite) {
                    specialFunction.context = {};
                    specialFunction.beforeSuite.apply(specialFunction.context);
                }
            } catch (e) {
                self.doError("Error executing beforeSuite: " + e.message);
            }
            
            self.testQueue.next();
        });
    };
    
    TestFramework.prototype._endSuite = function _endSuite(suiteName) {
        var self = this;
        this.testQueue.then(function endSuiteTask() {
            try {
                var specialFunction = self.specialFunctions[suiteName];
                if (specialFunction && specialFunction.afterSuite) {
                    specialFunction.context = specialFunction.context || {};
                    specialFunction.afterSuite.apply(specialFunction.context);
                }
            } catch (e) {
                self.doError("Error executing afterSuite: " + e.message);
            }
            
            self.onSuiteEnd(suiteName);
            self.testQueue.next();
        });
    };
    
    
    // normalize the indentation of the function to strip out extra indentation in the source code
    TestFramework.prototype._formatFunction = function _formatFunction(func) {
        var lines = func ? func.toString().split("\n") : [];
        var numLines = lines.length;
        if (numLines) {
            var offset = 0;
            while (offset < lines[numLines - 1].length && lines[numLines - 1].charAt(offset) === " ") {
                offset++;
            }
        }
        return lines.join("\n").replace(new RegExp("\n[ ]{" + offset + "}", "g"), "\n");
    };

    // Simple seedable random number generator
    TestFramework.prototype.randSeed = function randSeed(seed) {
        this.doLog("Using random seed: " + seed);
        this._rand_z = seed;
        this._rand_w = seed + 1;
    };

    TestFramework.prototype.randInt = function randInt() {
        this._rand_z = (36969 * (this._rand_z & 65535) + (this._rand_z >> 16)) % MAX_INT32;
        this._rand_w = (18000 * (this._rand_w & 65535) + (this._rand_w >> 16)) % MAX_INT32;
        return ((this._rand_z << 16) + this._rand_w + MAX_INT32) % MAX_INT32;
    }
    
    // Global error handler for catching errors which happen asynchronously from the test
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
        error.returnValue = true;
        return true;
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

    // Replace the global console object with some intercepts which allow the test
    // logger to capture log output.

    if (!global.console) {
        global.console = {};
	}
	if (!global.console.log) {
		global.console.log = function () {};
	}
	if (!global.console.info) {
		global.console.info = function () {};
	}
	if (!global.console.error) {
		global.console.error = function () {};
	}
	if (!global.console.group) {
		global.console.group = function () {};
	}
	if (!global.console.groupEnd) {
		global.console.groupEnd = function () {};
	}
	
    var oldLog = Function.prototype.bind.call(global.console.log, global.console);
    var oldInfo = Function.prototype.bind.call(global.console.info, global.console);
    var oldError = Function.prototype.bind.call(global.console.error, global.console);
    
    TestFramework.prototype.doLog = function () {
        oldLog.apply(global.console, arguments);
    };
    
    TestFramework.prototype.doInfo = function () {
        oldInfo.apply(global.console, arguments);
    };
    
    TestFramework.prototype.doError = function () {
        oldError.apply(global.console, arguments);
    };
    

    var testModule = new TestFramework();
    testModule.Framework = TestFramework;
    
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
