define([
    '../test',
    '../logger/consoleLogger',
    '../logger/graphicalLogger'
], function (test, consoleLogger, graphicalLogger) {
    return function () {
        consoleLogger.listen(test);
        graphicalLogger.listen(test, document.getElementById("graphicalLogger"));
    };
});
