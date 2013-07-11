
define([
    './coverage'
], function (coverage) {
    return function enableCoverage() {
        var instrumenter = new Instrumenter({
            noCompact: true,
            noAutoWrap: true,
            embedSource: true
        });

        var oldEval = require.eval;
        require.eval = function (text, url) {
            var fileName = url.replace(/\.\.\//g, "");
            var result = oldEval(instrumenter.instrumentSync(text, fileName), url);
            __coverage__[fileName].code = text;
            return result;
        };

        coverage();
    };
});