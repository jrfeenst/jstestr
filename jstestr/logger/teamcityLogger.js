
define([], function () {

    function listen(test) {

        function escape(str) {
            if (typeof str !== 'string') {
                str = String(str);
            }
            return str.replace(/['\n\r\u0085\u2028\u2029|\[\]]/g, function (char) {
                switch (char) {
                case "'": return "|'";
                case '\n': return '|n';
                case '\r': return '|r';
                case '\u0085': return '|x';
                case '\u0085': return '|x';
                case '\u0085': return '|x';
                case '|': return '||';
                case '[': return '|[';
                case ']': return '|]';
                default: return char;
                }
            });
        }

        function log(type, name, attributes) {
            var message = '##teamcity[' + type + " name='" + escape(name) + "'";
            if (attributes) {
                var key;
                for (key in attributes) {
                    if (attributes.hasOwnProperty(key)) {
                        message += ' ' + key + "='" + escape(attributes[key]) + "'";
                    }
                }
            }
            message += ']';
            test.doLog(message);
        }


        test.on('onStart', function () {
            log('testSuiteStarted', test.results.name);
        });

        test.on('onSuiteStart', function (suiteName) {
            log('testSuiteStarted', suiteName);
        });

        var currentTest = '';
        test.on('onTestStart', function (suiteName, testName) {
            currentTest = testName;
            log('testStarted', currentTest);
        });


        test.on('onInfo', function () {
            log('testStdOut', currentTest, {
                out: Array.prototype.join.call(arguments, ' ')
            });
        });

        test.on('onLog', function () {
            log('testStdOut', currentTest, {
                out: Array.prototype.join.call(arguments, ' ')
            });
        });

        test.on('onError', function () {
            log('testStdErr', currentTest, {
                out: Array.prototype.join.call(arguments, ' ')
            });
        });

        test.on('onIgnored', function (suiteName, testName) {
            log('testIgnored', testName);
        });

        test.on('onFailed', function (suiteName, testName, error) {
            log('testFailed', testName, {
                 message: error.message,
                 details: error.stack || error.stacktrace
            });
        });

        test.on('onTestEnd', function (suiteName, testName) {
            log('testFinished', testName, {
                duration: this.results.suites[suiteName].tests[testName].elapsedTime
            });
        });

        test.on('onSuiteEnd', function (suiteName) {
            log('testSuiteFinished', suiteName);
        });

        test.on('onEnd', function () {
            log('testSuiteFinished', test.results.name);
        });
    }
    return {listen: listen};
});