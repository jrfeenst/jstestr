
define([], function () {
    function adapter(test, socket) {

        var results;

        test.on("onStart", function () {
            results = {
                passed: 0,
                failed: 0,
                total: 0,
                tests: []
            };
            socket.emit("tests-start");
        });

        test.on("onTestEnd", function (suiteName, testName) {
            var error, result = test.results.suites[suiteName][testName];
            
            var message = {name: suiteName + " - " + testName, items: []};
            message.passed = result.success ? 1 : 0;
            message.failed = result.success ? 0 : 1;
            message.total = 1;
            
            if (!result.success) {
                error = {passed: false};
            }
            if (result.error) {
                error.message = result.error.message;
                error.stacktrace = result.error.stack || result.error.stacktrace;
                message.items.push(error);
            }

            results.passed += message.passed;
            results.failed += message.failed;
            results.total++;
            results.tests.push(message);

            socket.emit("test-result", message);
        });

        test.on("onEnd", function () {
            socket.emit("all-test-results", {});
        });
    }

    function listen(test) {
        Testem.useCustomAdapter(adapter.bind(this, test));        
    }

    return {listen: listen};
});
