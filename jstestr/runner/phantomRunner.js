// Runner for phantomjs for easy test automation. Run with phantomjs:
// > phantomjs jstestr/runner/runner.js module=tests/testAll

var system = require("system");

var testPage = "jstestr/runner/runner.html?";
testPage += system.args.slice(1).join(";");

var page = require("webpage").create();

var testTimeout;
function resetTestTimeout() {
    clearTimeout(testTimeout);
    testTimeout = setTimeout(function () {
        console.log("Test page has had no activity and is being killed");
        phantom.exit(1);
    }, 60000);
}


page.onConsoleMessage = function (msg) {
    console.log(msg);
    resetTestTimeout();
    if (msg.indexOf("[TESTS FAILED]") === 0) {
        phantom.exit(1);
    } else if (msg.indexOf("[TESTS PASSED]") === 0) {
        phantom.exit(0);
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

