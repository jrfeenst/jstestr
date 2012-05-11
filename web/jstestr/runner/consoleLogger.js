
define([], function () {
    
    var global = this;
    
    function on(obj, method, func) {
        var oldMethod = obj[method];
        obj[method] = function () {
            func.apply(obj, arguments);
            oldMethod.apply(obj, arguments);
        };
    }
    
    
    return {
        listen: function (test) {
            
            on(test, "onLog", function onLog() {
                this.doLog(Array.prototype.join.call(arguments, " "));
            });
            
            on(test, "onInfo", function onInfo() {
                this.doInfo(Array.prototype.join.call(arguments, " "));
            });
            
            on(test, "onError", function onError() {
                this.doError(Array.prototype.join.call(arguments, " "));
            });
            
            
            on(test, "onStart", function onStart() {
                global.console.group("Tests Starting");
            });
            
            on(test, "onEnd", function onEnd() {
                var message;
                if (this.successfulTests < this.totalTests) {
                    message = "[TESTS FAILED] ";
                } else {
                    message = "[TESTS PASSED] ";
                }
                this.doLog(message + this.successfulTests + "/" + this.totalTests + " passed!");
                
                global.console.groupEnd();
            });
            
            on(test, "onSuiteStart", function onSuiteStart(suiteName) {
                global.console.group("Suite: " + suiteName + ".");
            });
            
            on(test, "onSuiteEnd", function onSuiteEnd(suiteName) {
                global.console.groupEnd();
            });
            
            on(test, "onTestStart", function onTestStart(suiteName, testName) {
                global.console.group("Test: " + suiteName + ", " + testName + ".");
            });
            
            on(test, "onTestEnd", function onTestEnd(suiteName, testName) {
            });
            
            on(test, "onSuccess", function onSuccess(suiteName, testName) {
                this.doLog("[Success]: " + suiteName + ", " + testName + ".");
                global.console.groupEnd();
            });
            
            on(test, "onFailure", function onFailure(suiteName, testName, error) {
                this.doError("[Failure]: " + suiteName + ", " + testName + ". " + error.message);
                global.console.group("Failed function:");
                this.doInfo(this._formatFunction(this.suites[suiteName][testName].test));
                global.console.groupEnd();
                if (error && (error.stack || error.stacktrace)) {
                    global.console.group("Stack trace:");
                    this.doInfo(error.stack || error.stacktrace);
                    global.console.groupEnd();
                }
                global.console.groupEnd();
                global.console.groupEnd();
            });
        }
    };
});
