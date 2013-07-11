define([
    './CoverageReport',
    '../logger/graphicalLogger'
], function (CoverageReport, graphicalLogger) {
    return function enableCoverage() {
        var listen = graphicalLogger.listen;
        graphicalLogger.listen = function (test, containerDiv) {
            listen.apply(this, arguments);

            var doc = containerDiv.ownerDocument;
            var tabs = doc.getElementById('tabs');
            var tabContents = doc.getElementById('tabContents');

            var coverageTab = doc.createElement('div');
            coverageTab.setAttribute('id', 'coverageTab');
            coverageTab.setAttribute('class', 'tab');
            coverageTab.innerHTML = 'Code Coverage';
            tabs.appendChild(coverageTab);

            var coverageNode = doc.createElement('div');
            coverageNode.setAttribute('id', 'coverageContent');
            coverageNode.setAttribute('class', 'tabContent');
            tabContents.appendChild(coverageNode);

            var coverage = new CoverageReport(coverageNode);

            test.on('onStart', function (suiteName, testName) {
                coverage.reset();

                // save or restore the coverage at the start of the test
                if (test._originalCoverage) {
                    __coverage__ = JSON.parse(test._originalCoverage);
                } else {
                    test.originalCoverage = JSON.stringify(__coverage__);
                }
                test.coverage = __coverage__;
            });

            test.on('onEnd', function (suiteName, testName) {
                coverage.generate(test.coverage);
            });
        };
    };
});
