
define([
    "./queue"
], function (queue) {
    
    var global = this;
    
    var TestFramework = function () {
        this.suites = {};
        this.document = document;
        this.global = global;
        
    };
    
    
    TestFramework.prototype._normalizeTest = function _normalizeTest(test) {
        if (typeof test === "function") {
            return {
                test: test
            };
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
            this.defineTest(suiteName, name, this._normalizeTest(tests[name]));
        }
    };
    
    TestFramework.prototype.defineTest = function defineTest(suiteName, name, test) {
        var suite = this.suites[suiteName];
        if (!suite) {
            suite = {};
            this.suites[suiteName] = suite;
        }
        suite[name] = test;
        this.onTestDefined(suiteName, name, test);
    };
    
    TestFramework.prototype.runAll = function runAll() {
        this.testQueue = new queue();
        var self = this;
        for (var suiteName in this.suites) {
            var suite = this.suites[suiteName];
            
            this.startSuite(suiteName);
            
            for (var testName in suite) {
                this._runTest(suiteName, testName);
            }
            
            this.endSuite(suiteName);
        }
        
        return this.testQueue.start(suite.timeout);
    };
    
    TestFramework.prototype.setTestNodeParent = function setTestNodeParent(parentNode) {
        this.testNodeParent = parentNode;
    };
    
    TestFramework.prototype.getNewTestNode = function getNewTestNode(cleanup) {
        if (!this.testNodeParent) {
            this.testNodeParent = document.createElement("div");
            document.body.appendChild(this.testNodeParent);
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
    
    
    TestFramework.prototype._runTest = function _runTest(suiteName, testName) {
        var self = this;
        this.testQueue.then(function _runTestTask() {
            var testExecutor = function testExecutor() {
                var start = new Date();
                var test = self.suites[suiteName][testName];
                
                self.onTestStart(suiteName, testName);
                
                test.elapsedTime = undefined;
                test.success = undefined;
                test.error = undefined;
                
                var success = function success() {
                    var end = new Date();
                    test.elapsedTime = end.getTime() - start.getTime();
                    test.success = true;
                    self._cleanupTestNodes();
                    self.onSuccess(suiteName, testName);
                    self.onTestEnd(suiteName, testName);
                    self.testQueue.next();
                }
                
                var failure = function failure(error) {
                    var end = new Date();
                    test.elapsedTime = end.getTime() - start.getTime();
                    test.error = error;
                    test.success = false;
                    self._cleanupTestNodes();
                    self.onFailure(suiteName, testName, error);
                    self.onTestEnd(suiteName, testName);
                    self.testQueue.next();
                }
                
                try {
                    if (test.test.name) {
                        test.future = test.test();
                    } else {
                        // create a wrapper function with the testName as the name of the function so
                        // that the test function shows up in the stack trace
                        eval("var runner = function " + testName.replace(/ /g, "_") +
                            "() { return test.test(); };");
                        test.future = runner();
                    }
                    
                    if (test.future && test.future.then) {
                        test.future.then(success, failure);
                    } else {
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
    
    
    TestFramework.prototype.startSuite = function startSuite(suiteName) {
        var self = this;
        this.testQueue.then(function startSuiteTask() {
            self.onSuiteStart(suiteName);
            self.testQueue.next();
        });
    };
    
    TestFramework.prototype.endSuite = function endSuite(suiteName) {
        var self = this;
        this.testQueue.then(function endSuiteTask() {
            self.onSuiteEnd(suiteName);
            self.testQueue.next();
        });
    };
    
    
    TestFramework.prototype.onSuccess = function logSuccess(suiteName, testName) {
        testDepth--;
        global.console.log("[Success]: " + suiteName + ", " + testName + ".");
    };
    
    TestFramework.prototype.onFailure = function logFailure(suiteName, testName, error) {
        testDepth--;
        global.console.error("[Failure]: " + suiteName + ", " + testName + ".", error);
        testDepth++;
        global.console.info("Failed function:");
        testDepth++;
        global.console.info(this._formatFunction(this.suites[suiteName][testName].test));
        testDepth--;
        if (error && (error.stack || error.stacktrace)) {
            global.console.info("Stack trace:");
            testDepth++;
            global.console.info(error.stack || error.stacktrace);
            testDepth--;
        }
        testDepth--;
    };
    
    TestFramework.prototype.onSuiteStart = function onSuiteStart(suiteName) {
        global.console.log("Suite starting: " + suiteName + ".");
        testDepth++;
    };
    
    TestFramework.prototype.onSuiteEnd = function onSuiteEnd(suiteName) {
        testDepth--;
    };
    
    TestFramework.prototype.onTestStart = function logTestStart(suiteName, testName) {
        global.console.log("Test starting: " + suiteName + ", " + testName + ".");
        testDepth++;
    };
    
    TestFramework.prototype.onTestEnd = function logTestEnd(suiteName, testName) {
        global.console.log("-------------------------------------------------------------");
    };
    
    TestFramework.prototype.onTestDefined = function logTestEnd(suiteName, testName) {
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
    }
    
    
    
    
    var testr = new TestFramework();
    var testModule = {
        defineSuite: function defineSuite() {
            return testr.defineSuite.apply(testr, arguments);
        },
        runAll: function runAll() {
            return testr.runAll.apply(testr, arguments);
        },
        suites: testr.suites,
        
        setTestNodeParent: function setTestNodeParent() {
            return testr.setTestNodeParent.apply(testr, arguments);
        },
        
        getNewTestNode: function getNewTestNode() {
            return testr.getNewTestNode.apply(testr, arguments);
        },
        
        log: function () {},
        info: function () {},
        error: function () {},
        
        Framework: TestFramework // for testing the test framework
    };
    
    
    var testDepth = 1;
    function offset() {
        return (new Array(testDepth)).join("    ");
    }
    
    if (!global.console) {
        global.console = {
            log: function () {},
            info: function () {},
            error: function () {}
        }
    }
    var oldLog = global.console.log;
    global.console.log = function log() {
        oldLog.apply(this, arguments);
        var message = Array.prototype.join.call(arguments, " ");
        testModule.log(offset() + message.replace(/\n/g, "\n" + offset()));
    };
    
    var oldInfo = global.console.info;
    global.console.info = function info() {
        oldInfo.apply(this, arguments);
        var message = Array.prototype.join.call(arguments, " ");
        testModule.info(offset() + message.replace(/\n/g, "\n" + offset()));
    };
    
    var oldError = global.console.error;
    global.console.error = function error() {
        oldError.apply(this, arguments);
        var message = Array.prototype.join.call(arguments, " ");
        testModule.error(offset() + message.replace(/\n/g, "\n" + offset()));
    };
    
    return testModule;
});