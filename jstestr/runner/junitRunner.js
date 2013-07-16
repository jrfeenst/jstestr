// Runner for phantomjs for easy test automation. Run with phantomjs:
// > phantomjs jstestr/runner/junitRunner.js module=tests/testAll

var system = require("system");

var testPage = "jstestr/runner/junitRunner.html?";
testPage += system.args.slice(1).join(";");

var page = require("webpage").create();
var fs = require("fs");

var testTimeout;
function resetTestTimeout() {
    clearTimeout(testTimeout);
    testTimeout = setTimeout(function () {
        console.log("Test page has had no activity and is being killed");
        phantom.exit(1);
    }, 60000);
}

var failed;
var name = testPage.replace(/.*module=([^&]+).*/, '$1');

page.onConsoleMessage = function (msg) {
    if (msg.indexOf("##teamcity[") === 0) {
        console.log(msg);
    } else if (msg.indexOf("<testsuites") === 0) {
        fs.writeFile("testresults.xml", msg, function (err) {
            if (err) {
                console.log(err);
            } else {
                console.log("Saved test results.");
            }
        });
    }

    resetTestTimeout();
    if (msg.indexOf("##teamcity[testFailed") === 0) {
        failed = true;
    }

    if (msg.indexOf("##teamcity[testSuiteFinished name='" + name + "']") === 0) {
        phantom.exit(failed ? 1 : 0);
    }
};

page.open(testPage, function (status) {
    if (status !== "success") {
        console.log("Failed to load the tests.");
        phantom.exit(1);
    } else {
        console.log("Page has loaded successfully.");
        resetTestTimeout();
    }
});
