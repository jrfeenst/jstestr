// NodeJS runner, requires requirejs node module.
// Executed with:
// > node jstestr/runner/nodeRunner.js module=tests/testAssert

var requirejs = require("requirejs");

requirejs.config({
    nodeRequire: require
});

requirejs.config({baseUrl: ""});

requirejs([
    "jstestr/runner/consoleLogger",
    "jstestr/test"
], function (consoleLogger, test) {

    consoleLogger.listen(test);
    
    var args = process.argv.slice(2);

    var modules = [];
    var suite;
    var suiteTest;
    var config = {};
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
            case "run":
                run = value === "true";
            default:
                console.error("Unknown argument: " + args[i]);
                break;
        }
    }

    requirejs.config(config);

    requirejs(modules, function () {
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
    });
});