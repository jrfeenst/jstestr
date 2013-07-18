// NodeJS runner, requires requirejs node module.
// Executed with:
// > node jstestr/runner/nodeRunner.js module=tests/testAssert

var requirejs = require("requirejs");
var PATH = require("path");
var fs = require("fs");

requirejs.config({
    nodeRequire: require
});


function getModulesFromPath(path) {
    var files = [];

    function traverse(path) {
        var stats = fs.statSync(path);
        if (stats.isDirectory()) {
            fs.readdirSync(path).forEach(function (dir) {
                var pathName = PATH.join(path, dir);

                var stats = fs.statSync(pathName);
                if (stats.isDirectory()) {
                    traverse(pathName);
                } else if (stats.isFile()) {
                    files.push(pathName);
                }
            });
        } else {
            files.push(path);
        }
    }

    traverse(path);
    return files;
}

requirejs([
    "jstestr/logger/consoleLogger",
    "jstestr/logger/memoryLogger",
    "jstestr/test"
], function (consoleLogger, memoryLogger, test) {

    consoleLogger.listen(test);
    memoryLogger.listen(test);
    
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
            case "path":
                modules = modules.concat(getModulesFromPath(value));
                break;
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
        }
    }

    requirejs(modules, function () {
        if (run) {
            var result;
            if (suite) {
                result = test.runSuite(suite);
            } else if (suiteTest) {
                var parts = suiteTest.split(":");
                result = test.runTest(parts[0], parts[1])
            } else {
                result = test.runAll();
            }

            result.then(function () {
                process.exit(0);
            }, function () {
                process.exit(1);
            });
        } 
    });
});