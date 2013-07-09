define([
    "./graphicalLogger"
], function (graphicalLogger) {
    var listen = graphicalLogger.listen;
    graphicalLogger.listen = function (test, containerDiv) {
        listen.apply(this, arguments);

        var doc = containerDiv.ownerDocument;
        var tabs = doc.getElementById("tabs");
        var tabContents = doc.getElementById("tabContents");

        var coverageTab = doc.createElement("div");
        coverageTab.setAttribute("id", "coverageTab");
        coverageTab.setAttribute("class", "tab");
        coverageTab.innerHTML = "Code Coverage";
        tabs.appendChild(coverageTab);

        var coverage = doc.createElement("div");
        coverage.setAttribute("id", "coverageContent");
        coverage.setAttribute("class", "tabContent");
        tabContents.appendChild(coverage);

        test.on("onStart", function (suiteName, testName) {
            coverage.innerHTML = "";
        });

        test.on("onTestEnd", function (suiteName, testName) {
            var functions = Object.keys(__coverage__).map(function (file) {
                var covered = total = 0;
                Object.keys(__coverage__[file].f).forEach(function (index) {
                    var count = __coverage__[file].f[index];
                    if (count > 0) {
                        covered += 1;
                    }
                    total += 1;
                });
                var summary = Math.round(covered / total * 100) + "%"
                return "<tr><td>" + file + "</td><td>" + summary + "</td></tr>";
            });
            coverage.innerHTML = "<table>\n" + functions.join("\n") + "\n</table>";
        });
    };
});
