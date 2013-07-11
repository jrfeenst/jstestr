
define([
    './coverage'
], function (coverage) {
    return function enableCoverage() {
        var instrumenter = new Instrumenter({
            noCompact: true,
            noAutoWrap: true,
            embedSource: true
        });

        function noop() {}

        var oldLoad = require.load;
        require.load = function (context, moduleName, url) {
            var fileName = url.replace(/\.\.\//g, "");
            function handleXhrResponse(text) {
                try {
                    eval(instrumenter.instrumentSync(text, fileName) + "\r\n////@ sourceURL=" + url);
                    __coverage__[fileName].code = text;
                    context.completeLoad(moduleName);
                } catch (err) {
                    var e = new Error("Error loading with XHR: " + url);
                    e.requireType = "xhr";
                    e.requireModules = [moduleName];
                    e.originalError = err;
                    context.onError(e);
                }
            }

            function handleXhrFault(text) {
                var e = new Error("Error loading with XHR: " + url);
                e.requireType = "xhr";
                e.requireModules = [moduleName];
                context.onError(e);
            }

            var xhr = new XMLHttpRequest();
            var complete = false;
            xhr.onreadystatechange = function () {
                var status;
                if (xhr.readyState === 0) {
                    // 0 means cancelled
                    complete = true;
                    handleXhrFault(id, "XHR readyState 0");
                } else if (xhr.readyState === 4 && !complete) {
                    // 4 is done
                    complete = true;

                    status = xhr.status || 0;
                    if ((status >= 200 && status < 300) || status === 304) {
                        handleXhrResponse(xhr.responseText);
                    } else {
                        handleXhrFault(xhr.responseText);
                    }
                }
                if (complete && xhr) {
                    // memory leak prevention
                    xhr.onreadystatechange = noop;
                    xhr = null;
                }
            };
            xhr.open("GET", url, true);
            xhr.send();
        };

        coverage();
    };
});