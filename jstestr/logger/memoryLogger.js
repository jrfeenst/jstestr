
define([], function () {
    
    var global = this;
    
    return {
        listen: function (test) {

            function getTestResult(suiteName, testName) {
                if (!test.results) {
                    test.results = {log: [], suites: {}};
                }
                if (suiteName && testName) {
                    if (!test.results.suites[suiteName]) {
                        test.results.suites[suiteName] = {};
                    }
                    if (!test.results.suites[suiteName][testName]) {
                        test.results.suites[suiteName][testName] = {log: []};
                    }
                    return test.results.suites[suiteName][testName];
                } else {
                    return test.results;
                }
            }
            
            test.on("onLog", function onLog() {
                getTestResult(this.currentSuiteName, this.currentTestName).log.push({
                    type: "log",
                    text: Array.prototype.join.call(arguments, " ")
                });
            });
            
            test.on("onInfo", function onInfo() {
                getTestResult(this.currentSuiteName, this.currentTestName).log.push({
                    type: "info",
                    text: Array.prototype.join.call(arguments, " ")
                });
            });
            
            test.on("onError", function onError() {
                getTestResult(this.currentSuiteName, this.currentTestName).log.push({
                    type: "error",
                    text: Array.prototype.join.call(arguments, " ")
                });
            });
            
            
            test.on("onStart", function onStart() {
                this.results = {
                    suites: {}
                };
            });
            
            test.on("onEnd", function onEnd() {
                this.results.successfulTests = this.successfulTests;
                this.results.ignoredTests = this.ignoredTests;
                this.results.totalTests = this.totalTests;

                this.results.success = this.successfulTests + this.ignoredTests === this.totalTests;
            });
            
            test.on("onSuiteStart", function onSuiteStart(suiteName) {
                this.results.suites[suiteName] = {};
            });

            test.on("onTestStart", function onTestStart(suiteName, testName) {
                this.results.suites[suiteName][testName] = {log: []};
            });
            
            test.on("onSuccess", function onSuccess(suiteName, testName) {
                this.results.suites[suiteName][testName].success = true;
                this.results.suites[suiteName][testName].ignored = false;
            });
            
            test.on("onIgnore", function onSuccess(suiteName, testName) {
                this.results.suites[suiteName][testName].success = false;
                this.results.suites[suiteName][testName].ignored = true;
            });
            
            test.on("onFailure", function onFailure(suiteName, testName, error) {
                var testResult = this.results.suites[suiteName][testName];
                testResult.success = false;
                testResult.ignored = false;

                testResult.error = error && error.message;
                testResult.test = this._formatFunction(test.suites[suiteName][testName].test);
                
                if (error && (error.stack || error.stacktrace)) {
                    testResult.stack = error.stack || error.stacktrace;
                }

                if (test.suites[suiteName][testName].domSnapshot.length > 0) {
                    testResult.domSnapshot = test.suites[suiteName][testName].domSnapshot;
                }
            });
        }
    };
});
