define([
    "require",
    "jstestr/runner/consoleLogger",
    "jstestr/runner/graphicalLogger",
    "jstestr/test"
], function (require, consoleLogger, graphicalLogger, test) {
    consoleLogger.listen(test);
    graphicalLogger.listen(test, document.getElementById("graphicalLogger"));
    
    // parse the query string
    var query = location.search.substring(1, location.search.length);
    var args = query.split("&");

    var modules = [];
    var suite;
    var suiteTest;
    var config = {};
    var configUrl = "";
    var randomOrder = true;
    var run = true;

    for (var i in args) {
        var arg = args[i].split("=");
        var key = arg[0];
        var value = arg[1];
        switch (key.toLowerCase()) {
            case "module":
                modules.push(value);
                break;
            case "suite":
                suite = unescape(value);
                break;
            case "test":
                suiteTest = unescape(value);
                break;
            case "config":
                config = JSON.parse(value);
                break;
            case "configurl":
                configUrl = value;
                break;
            case "randomorder":
                randomOrder = value === "true";
                break;
            case "randseed":
                test.randSeed(parseInt(value, 10));
                break;
            case "run":
                run = value === "true";
                break;
            default:
                console.error("Unknown argument: " + args[i]);
                break;
        }
    }

    test.randomOrder = randomOrder;

    function runTests() {
        if (run) {
            var future;
            if (suite) {
                future = test.runSuite(suite);
            } else if (suiteTest) {
                var parts = suiteTest.split(":");
                future = test.runTest(parts[0], parts[1]);
            } else {
                future = test.runAll();
            }

            future.then(null, function (failure) {
                self.doError("The test runner failed to complete: " + failure);
            });
        } 
    }

    function error() {
        console.error("Error loading the test modules");
    }
    
    function loadAndRunTests(config) {
        if (Object.keys(config).length > 0) {
            require(config, modules, runTests, error);
        } else {
            require(modules, runTests, error);
        }
    }

    if (configUrl) {
        require([configUrl], function (config) {
            loadAndRunTests(config);
        }, function () {
            console.error("Error loading the configUrl: " + configUrl);
        });
    } else {
        loadAndRunTests(config);
    }
});