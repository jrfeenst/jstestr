
define([], function () {
    
    var global = this;
    
    return {
        listen: function (test) {
            
            test.on("onLog", function onLog() {
                this.doLog(Array.prototype.join.call(arguments, " "));
            });
            
            test.on("onInfo", function onInfo() {
                this.doInfo(Array.prototype.join.call(arguments, " "));
            });
            
            test.on("onError", function onError() {
                this.doError(Array.prototype.join.call(arguments, " "));
            });
            
            
            test.on("onStart", function onStart() {
                global.console.group("Tests Starting");
            });
            
            test.on("onEnd", function onEnd() {
                var message;
                if (this.successfulTests + this.ignoredTests < this.totalTests) {
                    message = "[TESTS FAILED] ";
                } else {
                    message = "[TESTS PASSED] ";
                }
                this.doLog(message + this.successfulTests + "/" + this.totalTests + " passed, " + this.ignoredTests + " ignored!");
                
                global.console.groupEnd();
            });
            
            test.on("onSuiteStart", function onSuiteStart(suiteName) {
                global.console.group("Suite: " + suiteName + ".");
            });
            
            test.on("onSuiteEnd", function onSuiteEnd(suiteName) {
                global.console.groupEnd();
            });
            
            test.on("onTestStart", function onTestStart(suiteName, testName) {
                global.console.group("Test: " + suiteName + ", " + testName + ".");
            });
            
            test.on("onTestEnd", function onTestEnd(suiteName, testName) {
                global.console.groupEnd();
            });
            
            test.on("onSuccess", function onSuccess(suiteName, testName) {
                this.doLog("[Success]: " + suiteName + ", " + testName + ".");
            });
            
            test.on("onIgnore", function onSuccess(suiteName, testName) {
                this.doLog("[Ignore]: " + suiteName + ", " + testName + ".");
            });
            
            test.on("onFailure", function onFailure(suiteName, testName, error) {
                var i, testPoint = this.suites[suiteName][testName];
                this.doError("[Failure]: " + suiteName + ", " + testName + ". " + error.message);
                global.console.group("Failed function:");
                this.doInfo(this._formatFunction(testPoint.test));
                global.console.groupEnd();
                if (error && (error.stack || error.stacktrace)) {
                    global.console.group("Stack trace:");
                    this.doInfo(error.stack || error.stacktrace);
                    global.console.groupEnd();
                }
                if (testPoint.domSnapshot.length > 0) {
                    global.console.group("DOM Snapshots after failure: ");
                    for (i = 0; i < testPoint.domSnapshot.length; i += 1) {
                        this.doInfo(testPoint.domSnapshot[i]);
                    }
                    global.console.groupEnd();
                }
                global.console.groupEnd();
            });
        }
    };
});
