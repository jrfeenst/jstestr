
define([], function () {
    
    function on(obj, method, func) {
        var oldMethod = obj[method];
        obj[method] = function () {
            func.apply(obj, arguments);
            oldMethod.apply(obj, arguments);
        };
    }
    
    
    return {
        listen: function (test) {

            var testDepth = 1;
            function offset() {
                return (new Array(testDepth)).join("    ");
            }


            function offsetLog(message) {
                test.doLog(offset() + message.replace(/\n/g, "\n" + offset()));
            }

            function offsetInfo(message) {
                test.doInfo(offset() + message.replace(/\n/g, "\n" + offset()));
            }

            function offsetError(message) {
                test.doError(offset() + message.replace(/\n/g, "\n" + offset()));
            }
            
            
            on(test, "onLog", function onLog() {
                offsetLog.apply(this, [Array.prototype.join.call(arguments, " ")]);
            });
            
            on(test, "onInfo", function onInfo() {
                offsetInfo.apply(this, [Array.prototype.join.call(arguments, " ")]);
            });
            
            on(test, "onError", function onError() {
                offsetError.apply(this, [Array.prototype.join.call(arguments, " ")]);
            });
            
            
            on(test, "onStart", function onStart() {
                offsetLog("Tests Starting");
                testDepth++;
            });
            
            on(test, "onEnd", function onEnd() {
                var totalTests = 0;
                var passingTests = 0;
                for (var suiteName in this.suites) {
                    for (var testName in this.suites[suiteName]) {
                        totalTests++;
                        if (this.suites[suiteName][testName].success) {
                            passingTests++;
                        }
                    }
                }
                testDepth--;
                offsetLog("Tests done. " + passingTests + "/" + totalTests + " Passed");
            });
            
            on(test, "onSuiteStart", function onSuiteStart(suiteName) {
                offsetLog("Suite starting: " + suiteName + ".");
                testDepth++;
            });
            
            on(test, "onSuiteEnd", function onSuiteEnd(suiteName) {
                testDepth--;
            });
            
            on(test, "onTestStart", function onTestStart(suiteName, testName) {
                offsetLog("Test starting: " + suiteName + ", " + testName + ".");
                testDepth++;
            });
            
            on(test, "onTestEnd", function onTestEnd(suiteName, testName) {
                offsetLog("-------------------------------------------------------------");
            });
            
            on(test, "onSuccess", function onSuccess(suiteName, testName) {
                testDepth--;
                offsetLog("[Success]: " + suiteName + ", " + testName + ".");
            });
            
            on(test, "onFailure", function onFailure(suiteName, testName, error) {
                testDepth--;
                offsetError("[Failure]: " + suiteName + ", " + testName + ".", error);
                testDepth++;
                offsetInfo("Failed function:");
                testDepth++;
                offsetInfo(this._formatFunction(this.suites[suiteName][testName].test));
                testDepth--;
                if (error && (error.stack || error.stacktrace)) {
                    offsetInfo("Stack trace:");
                    testDepth++;
                    offsetInfo(error.stack || error.stacktrace);
                    testDepth--;
                }
                testDepth--;
            });
            
            
            on(test, "onSuiteDefined", function onSuiteDefined(suiteName) {
                
            });
            
            on(test, "onTestDefined", function onTestDefined(suiteName) {
                
            });
        }
    };
});
