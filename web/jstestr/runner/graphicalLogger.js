
define([
    "jstestr/event"
], function (event) {
    
    var template =
        '<div class="graphicalLogger">' +
            '<div id="top">' +
                '<div id="testProgressBar" class="progressBar"></div>' +
            '</div>' +
            '<div id="mainWrapper">' +
                '<div id="main">' +
                    '<div id="testListWrapper">' +
                        '<div id="testList">' +
                        '</div>' +
                    '</div>' +
                    '<div id="tabContainer">' +
                        '<div id="tabs">' +
                            '<div id="logTab" class="tab selected">Log</div>' +
                            '<div id="testPageTab" class="tab">Test Page</div>' +
                        '</div>' +
                        '<div id="tabContentsWrapper">' +
                            '<div id="tabContents">' +
                                '<div id="logContent" class="tabContent selected"></div>' +
                                '<div id="testPageContent" class="tabContent">Test page contents</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>';
    
    
    function on(obj, method, func) {
        var oldMethod = obj[method];
        obj[method] = function () {
            func.apply(obj, arguments);
            oldMethod.apply(obj, arguments);
        };
    }
    
    
    return {
        listen: function(test, containerDiv) {
            var doc = containerDiv.ownerDocument;
            
            var link = doc.createElement("link");
            link.setAttribute("rel", "stylesheet");
            link.setAttribute("type", "text/css");
            link.setAttribute("href", "graphicalLogger.css");
            doc.querySelector("head").appendChild(link);
            
            containerDiv.innerHTML = template;
            
            test.setTestNodeParent(doc.getElementById("testPageContent"));
            
            
            // update the tabs
            var tabs = doc.getElementById("tabs");
            var tabContents = doc.getElementById("tabContents");
            tabs.addEventListener("click", function (event) {
                var i, id = event.target.id;
                for (i in tabs.children) {
                    tabs.children[i].className = "tab";
                }
                for (i in tabContents.children) {
                    tabContents.children[i].className = "tabContent";
                }
                event.target.className = "tab selected";
                var selectedTab = doc.getElementById(id.substring(0, id.length - 3) + "Content");
                selectedTab.className = "tabContent selected";
            }, false);
            
            
            var testList = doc.getElementById("testList");
            
            function suiteSelector(suiteName) {
                return '[data-suiteName="' + suiteName + '"]';
            }
            
            function testSelector(suiteName, testName) {
                return suiteSelector(suiteName) + ' [data-testName="' + testName + '"]';
            }
            
            function renderSuite(suiteName) {
                var suiteNode = doc.createElement("div");
                suiteNode.className = "suite";
                suiteNode.setAttribute("data-suiteName", suiteName);
                
                var suiteNameNode = doc.createElement("div");
                suiteNameNode.className = "suiteName";
                suiteNameNode.innerHTML = suiteName;
                
                suiteNode.appendChild(suiteNameNode);
                
                testList.appendChild(suiteNode);
                return suiteNode;
            }
            
            function renderTest(suiteName, testName) {
                var testNode = doc.createElement("div");
                testNode.className = "test";
                testNode.setAttribute("data-testName", testName);
                testNode.innerHTML = testName;
                
                var suiteNode = testList.querySelector(suiteSelector(suiteName));
                suiteNode.appendChild(testNode);
            }
            
            for (var suiteName in test.suites) {
                renderSuite(suiteName);
                
                var suite = test.suites[suiteName];
                for (var testName in suite) {
                    renderTest(suiteName, testName);
                }
            }
            
            on(test, "onSuiteDefined", renderSuite);
            on(test, "onTestDefined", renderTest);
            
            
            var logContent = doc.getElementById("logContent");
            
            on(test, "onStart", function () {
                logContent.innerHTML = "";
                
                testList.innerHTML = "";
                for (var suiteName in test.suites) {
                    renderSuite(suiteName);

                    var suite = test.suites[suiteName];
                    for (var testName in suite) {
                        renderTest(suiteName, testName);
                    }
                }
            });
            
            on(test, "onEnd", function () {
                var endNode = doc.createElement("div");
                endNode.className = "results ";
                
                var totalTests = 0;
                var passingTests = 0;
                for (var suiteName in this.suites) {
                    for (var testName in this.suites[suiteName]) {
                        totalTests++;
                        if (this.suites[suiteName][testName].success) {
                            passingTests++;
                        }
                    }
                }
                if (passingTests < totalTests) {
                    endNode.innerHTML = "[TESTS FAILED] ";
                    endNode.className += "failure";
                } else {
                    endNode.innerHTML = "[TESTS PASSED] ";
                    endNode.className += "success";
                }
                endNode.innerHTML += passingTests + "/" + totalTests + " passed!";
                
                logContent.appendChild(endNode);
            });
            
            on(test, "onSuiteStart", function (suiteName) {
                var suiteNode = doc.createElement("div");
                suiteNode.className = "suite";
                suiteNode.setAttribute("data-suiteName", suiteName);
                
                var suiteStartNode = doc.createElement("div");
                suiteStartNode.className = "suiteStart";
                suiteStartNode.innerHTML = "Starting suite: '" + suiteName + "'";
                suiteNode.appendChild(suiteStartNode);
                
                logContent.appendChild(suiteNode);
                
                testList.querySelector(suiteSelector(suiteName)).className += " running";
            });
            
            on(test, "onSuiteEnd", function (suiteName) {
                var success = true;
                for (var testName in test.suites[suiteName]) {
                    success = success && test.suites[suiteName][testName].success;
                }
                
                testList.querySelector(suiteSelector(suiteName)).className = "suite " +
                    (success ? "success" : "failure");
            });
            
            on(test, "onTestStart", function (suiteName, testName) {
                var testNode = doc.createElement("div");
                testNode.className = "test";
                testNode.setAttribute("data-testName", testName);
                
                var testStartNode = doc.createElement("div");
                testStartNode.className = "testStart";
                testStartNode.innerHTML = "Starting test: '" + testName + "'";
                testNode.appendChild(testStartNode);
                
                var testLogNode = doc.createElement("div");
                testLogNode.className = "testLog";
                testNode.appendChild(testLogNode);
                
                logContent.querySelector(suiteSelector(suiteName)).appendChild(testNode);
                
                testList.querySelector(testSelector(suiteName, testName)).className += " running";
            });
            
            on(test, "onSuccess", function (suiteName, testName) {
                var testNode = doc.createElement("div");
                testNode.className = "success";
                testNode.innerHTML = "[SUCCESS] '" + testName + "' - elapsed time: " +
                    test.suites[suiteName][testName].elapsedTime + "ms";
                
                logContent.querySelector(testSelector(suiteName, testName)).appendChild(testNode);
                
                testList.querySelector(testSelector(suiteName, testName)).className = "test success";
            });
            
            on(test, "onFailure", function (suiteName, testName, error) {
                var testNode = doc.createElement("div");
                testNode.className = "failure";
                testNode.innerHTML = "[FAILURE] '" + testName + "' - elapsed time: " +
                    test.suites[suiteName][testName].elapsedTime + "ms";
                
                var errorNode = doc.createElement("div");
                errorNode.className = "error";
                errorNode.innerHTML = "Error: " + error.message;
                testNode.appendChild(errorNode);
                
                var functionHeaderNode = doc.createElement("div");
                functionHeaderNode.className = "functionHeader";
                functionHeaderNode.innerHTML = "Failed test function: ";
                testNode.appendChild(functionHeaderNode);
                
                var functionNode = doc.createElement("div");
                functionNode.className = "function";
                functionNode.innerHTML = this._formatFunction(this.suites[suiteName][testName].test);
                functionHeaderNode.appendChild(functionNode);
                
                if (error && (error.stack || error.stacktrace)) {
                    var stackHeaderNode = doc.createElement("div");
                    stackHeaderNode.className = "stackHeader";
                    stackHeaderNode.innerHTML = "Stack trace: ";
                    testNode.appendChild(stackHeaderNode);

                    var stackNode = doc.createElement("div");
                    stackNode.className = "stack";
                    stackNode.innerHTML = error.stack || error.stacktrace;
                    stackHeaderNode.appendChild(stackNode);
                }
                
                logContent.querySelector(testSelector(suiteName, testName)).appendChild(testNode);
                testList.querySelector(testSelector(suiteName, testName)).className = "test failure";
            });
            
            on(test, "onLog", function () {
                if (this.currentSuiteName && this.currentTestName) {
                    var logNode = doc.createElement("div");
                    logNode.className = "log";
                    logNode.innerHTML = Array.prototype.join.call(arguments, " ");
                    logContent.querySelector(testSelector(this.currentSuiteName, this.currentTestName) +
                        " .testLog").appendChild(logNode);
                }
            });
            
            on(test, "onInfo", function () {
                if (this.currentSuiteName && this.currentTestName) {
                    var logNode = doc.createElement("div");
                    logNode.className = "info";
                    logNode.innerHTML = Array.prototype.join.call(arguments, " ");
                    logContent.querySelector(testSelector(this.currentSuiteName, this.currentTestName) +
                        " .testLog").appendChild(logNode);
                }
            });
            
            on(test, "onError", function () {
                if (this.currentSuiteName && this.currentTestName) {
                    var logNode = doc.createElement("div");
                    logNode.className = "error";
                    logNode.innerHTML = Array.prototype.join.call(arguments, " ");
                    logContent.querySelector(testSelector(this.currentSuiteName, this.currentTestName) +
                        " .testLog").appendChild(logNode);
                }
            });
        }
    };
    

});