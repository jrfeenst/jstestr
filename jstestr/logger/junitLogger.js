
define([], function () {
    
    var global = this;
    
    return {
        listen: function (test) {
            
            function convertTime(time) {
                return time;
            }

            function escape(str) {
                return String(str).replace(/"/g, "");
            }

            function XmlWriter() {
                this.depth = 0;
                this.strings = [];
            }

            XmlWriter.prototype.tag = function tag(name, attributes, fn) {
                this.depth++;
                var spacing = (new Array(this.depth)).join("    ");
                this.strings.push(spacing);
                this.strings.push("<" + name);
                
                Object.keys(attributes).forEach(function (attr) {
                    this.strings.push(" " + attr + "=\"" + escape(attributes[attr]) + "\"");
                }, this);
                this.strings.push(">\n");
                
                var len = this.strings.length;
                if (fn) {
                    fn();
                }

                if (len === this.strings.length) {
                    this.strings[len - 1] = "/>\n";
                } else {
                    this.strings.push(spacing);
                    this.strings.push("</" + name + ">\n");
                }
                this.depth--;
            };

            XmlWriter.prototype.text = function text(text) {
                this.strings.push(text);
            };

            XmlWriter.prototype.cdata = function cdata(text) {
                this.strings.push("<![CDATA[");
                this.strings.push(text);
                this.strings.push("]]>\n");
            };

            XmlWriter.prototype.stringify = function stringify() {
                return this.strings.join("");
            };

            test.on("onEnd", function onEnd() {
                var results = test.results;
                var report = new XmlWriter();

                report.tag("testsuites", {
                    name: results.name,
                    time: results.endTime.getTime() - results.startTime.getTime(),
                    tests: results.totalTests,
                    failures: results.totalTests - results.successfulTests - results.ignoredTests,
                    disabled: results.ignoredTests,
                    seed: results.seed
                }, function () {

                    // write all of the test suite result
                    Object.keys(results.suites).forEach(function (suiteName) {
                        var suite = results.suites[suiteName];

                        report.tag("testsuite", {
                            name: suiteName,
                            timestamp: convertTime(suite.startTime),
                            time: suite.endTime.getTime() - suite.startTime.getTime(),
                            failures: suite.totalTests - suite.successfulTests - suite.ignoredTests,
                            skipped: suite.ignoredTests,
                            tests: suite.totalTests
                        }, function () {

                            // write the test case results for this suite
                            Object.keys(suite.tests).forEach(function (testName) {
                                var testCase = suite.tests[testName];

                                report.tag("testcase", {
                                    name: testName,
                                    time: testCase.elapsedTime
                                }, function () {
                                    if (testCase.skipped) {
                                        report.tag("skipped", {}, function () {
                                            report.text("Test conditions: " + JSON.stringify(test.conditions));
                                        });
                                    }

                                    if (!testCase.success) {
                                        report.tag("failure", {
                                            type: "failure",
                                            message: testCase.error.message
                                        }, function () {
                                            report.cdata(testCase.error.stack || testCase.error.stack);
                                        });
                                    }

                                    // write the console output
                                    testCase.log.forEach(function (log) {
                                        var tag = log.type === "error" ? "system-err" : "system-out";
                                        report.tag(tag, {}, function () {
                                            report.cdata(log.text);
                                        });
                                    });
                                });
                            });
                        });
                    });
                });

                test.doLog(report.stringify());
            });
            
        }
    };
});
