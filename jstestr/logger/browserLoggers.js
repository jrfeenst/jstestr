define([
    '../test',
    './consoleLogger',
    './graphicalLogger'
], function (test, consoleLogger, graphicalLogger) {
    return function () {
        consoleLogger.listen(test);
        graphicalLogger.listen(test, document.getElementById("graphicalLogger"));
    };
});
