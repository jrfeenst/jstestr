define([
    '../test',
    '../logger/consoleLogger',
    '../logger/graphicalLogger',
    '../logger/memoryLogger'
], function (test, consoleLogger, graphicalLogger, memoryLogger) {
    return function () {
        consoleLogger.listen(test);
        graphicalLogger.listen(test, document.getElementById("graphicalLogger"));
        memoryLogger.listen(test);
    };
});
