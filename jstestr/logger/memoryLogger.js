
define([], function () {
    
    var global = this;
    
    return {
        listen: function (test) {

            function getTestResult(suiteName, testName) {
                if (!test.results) {
                    test.onStart();
                }
                if (suiteName && testName) {
                    return test.results.suites[suiteName].tests[testName];
                } else {
                    return test.results;
                }
            }
            
            test.on("onLog", function onLog() {
                getTestResult(this.currentSuiteName, this.currentTestName).log.push({
                    type: "log",
                    text: Array.prototype.join.call(arguments, " ")
                });
            }, true);
            
            test.on("onInfo", function onInfo() {
                getTestResult(this.currentSuiteName, this.currentTestName).log.push({
                    type: "info",
                    text: Array.prototype.join.call(arguments, " ")
                });
            }, true);
            
            test.on("onError", function onError() {
                getTestResult(this.currentSuiteName, this.currentTestName).log.push({
                    type: "error",
                    text: Array.prototype.join.call(arguments, " ")
                });
            }, true);
            
            
            test.on("onStart", function onStart() {
                this.results = {
                    name: global.location ? global.location.search.replace(/.*module=([^&]*).*/, "$1") : "node",
                    seed: this.seed,
                    startTime: new Date(),
                    suites: {},
                    log: []
                };
            }, true);
            
            test.on("onEnd", function onEnd() {
                this.results.successfulTests = this.successfulTests;
                this.results.ignoredTests = this.ignoredTests;
                this.results.totalTests = this.totalTests;
                this.results.endTime = new Date();
                this.results.success = this.successfulTests + this.ignoredTests === this.totalTests;
            }, true);
            
            test.on("onSuiteStart", function onSuiteStart(suiteName) {
                this.results.suites[suiteName] = {
                    startTime: new Date(),
                    totalTests: 0,
                    successfulTests: 0,
                    ignoredTests: 0,
                    tests: {}
                };
            }, true);

            test.on("onTestStart", function onTestStart(suiteName, testName) {
                this.results.suites[suiteName].totalTests++;
                this.results.suites[suiteName].tests[testName] = {log: []};
            }, true);

            test.on("onTestEnd", function onTestEnd(suiteName, testName) {
                this.results.suites[suiteName].tests[testName].elapsedTime = this.suites[suiteName][testName].elapsedTime;
            }, true);
            
            test.on("onSuccess", function onSuccess(suiteName, testName) {
                this.results.suites[suiteName].successfulTests++;
                this.results.suites[suiteName].tests[testName].success = true;
                this.results.suites[suiteName].tests[testName].ignored = false;
            }, true);
            
            test.on("onIgnore", function onSuccess(suiteName, testName) {
                this.results.suites[suiteName].ignoredTests++;
                this.results.suites[suiteName].tests[testName].success = false;
                this.results.suites[suiteName].tests[testName].ignored = true;
            }, true);
            
            test.on("onFailure", function onFailure(suiteName, testName, error) {
                var testResult = this.results.suites[suiteName].tests[testName];
                testResult.success = false;
                testResult.ignored = false;

                testResult.error = error || {};
                testResult.test = this._formatFunction(test.suites[suiteName][testName].test);
                
                if (error && (error.stack || error.stacktrace)) {
                    testResult.stack = error.stack || error.stacktrace;
                }

                if (test.suites[suiteName][testName].domSnapshot.length > 0) {
                    testResult.domSnapshot = test.suites[suiteName][testName].domSnapshot;
                }
            }, true);

            test.on("onSuiteEnd", function onSuiteEnd(suiteName) {
                this.results.suites[suiteName].endTime = new Date();
            });
        }
    };
});
