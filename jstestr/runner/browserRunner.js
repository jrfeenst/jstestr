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
            case "configUrl":
                configUrl = value;
            case "run":
                run = value === "true";
            default:
                console.error("Unknown argument: " + args[i]);
                break;
        }
    }

    function runTests() {
        if (run) {
            if (suite) {
                test.runSuite(suite);
            } else if (suiteTest) {
                var parts = suiteTest.split(":");
                test.runTest(parts[0], parts[1]);
            } else {
                test.runAll();
            }
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