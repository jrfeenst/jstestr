
define([
    "jstestr/event"
], function (event) {
    
    var template =
        '<div class="graphicalLogger">' +
            '<div id="top">' +
                '<button id="runAll">Run All</button>' +
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
    
    
    function addClass(element, className) {
        element.className += " " + className;
    }
    
    function removeClass(element, className) {
        var classes = element.className.split(" ");
        var i = classes.indexOf(className);
        if (i >= 0) {
            classes.splice(i, 1);
            element.className = classes.join(" ");
        }
    }
    
    function toggleClass(element, className) {
        if (element.className.indexOf(className) >= 0) {
            removeClass(element, className);
        } else {
            addClass(element, className);
        }
    }
    
            
    function suiteSelector(suiteName) {
        return '[data-suiteName="' + suiteName + '"]';
    }

    function testSelector(suiteName, testName) {
        return suiteSelector(suiteName) + ' [data-testName="' + testName + '"]';
    }
    
    
    var escape = function escape(str) {
      var self = arguments.callee;
      self.text.data = str;
      return self.div.innerHTML;
    };
    escape.div = document.createElement("div");
    escape.text = document.createTextNode("");
    escape.div.appendChild(escape.text);
    
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
            var logContent = doc.getElementById("logContent");
            var testList = doc.getElementById("testList");
            var runAll = doc.getElementById("runAll");
            
            function switchTab(node) {
                var i, id = node.id;
                for (i = 0; i < tabs.children.length; i++) {
                    removeClass(tabs.children[i], "selected");
                }
                for (i = 0; i < tabContents.children.length; i++) {
                    removeClass(tabContents.children[i], "selected");
                }
                addClass(node, "selected");
                var selectedTab = doc.getElementById(id.substring(0, id.length - 3) + "Content");
                addClass(selectedTab, "selected");
            }
            
            tabs.addEventListener("click", function (event) {
                switchTab(event.target);
            }, false);
            
            function showTestPageTab() {
                switchTab(doc.getElementById("testPageTab"));
            }
            
            function showLogTab() {
                switchTab(doc.getElementById("logTab"));
            }
            
            
            event.on("click", runAll, function () {
                test.runAll();
            });
            
            
            function toggleControls(node) {
                for (var suite in test.suites) {
                    var suiteNode = testList.querySelector(suiteSelector(suite) + " .suiteName");
                    if (suiteNode !== node) {
                        removeClass(suiteNode, "controlsVisible");
                    }
                    for (var name in test.suites[suite]) {
                        var testNode = testList.querySelector(testSelector(suite, name));
                        if (testNode !== node) {
                            removeClass(testNode, "controlsVisible");
                        }
                    }
                }
                
                toggleClass(node, "controlsVisible");
            }
            
            
            function renderControls(suiteName, testName) {
                var controlsNode = doc.createElement("div");
                controlsNode.className = "controls";
                
                var runNode = doc.createElement("button");
                runNode.className = "run";
                runNode.innerHTML = "Run";
                controlsNode.appendChild(runNode);
                
                event.on("click", runNode, function (ev) {
                    ev.preventDefault();
                    ev.stopPropagation();
                    if (testName) {
                        test.runTest(suiteName, testName);
                    } else {
                        test.runSuite(suiteName);
                    }
                });
                
                return controlsNode;
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
                
                suiteNameNode.appendChild(renderControls(suiteName));
                
                event.on("click", suiteNameNode, function () {
                    toggleControls(suiteNameNode);
                });
                
                return suiteNode;
            }
            
            function renderTest(suiteName, testName) {
                var testNode = doc.createElement("div");
                testNode.className = "test";
                testNode.setAttribute("data-testName", testName);
                testNode.innerHTML = testName;
                
                var suiteNode = testList.querySelector(suiteSelector(suiteName));
                suiteNode.appendChild(testNode);
                
                testNode.appendChild(renderControls(suiteName, testName));
                
                event.on("click", testNode, function () {
                    var output = logContent.querySelector(testSelector(suiteName, testName));
                    if (output) {
                        output.scrollIntoView();
                    }
                    toggleControls(testNode);
                });
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
            
            function scrollToBottom() {
                tabContents.scrollTop = tabContents.scrollHeight;
            }
            
            on(test, "onStart", function () {
                logContent.innerHTML = "";
            });
            
            on(test, "onEnd", function () {
                var endNode = doc.createElement("div");
                endNode.className = "results";
                
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
                    addClass(endNode, "failure");
                } else {
                    endNode.innerHTML = "[TESTS PASSED] ";
                    addClass(endNode, "success");
                }
                endNode.innerHTML += passingTests + "/" + totalTests + " passed!";
                
                logContent.appendChild(endNode);
                
                scrollToBottom();
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
                
                var suiteListNode = testList.querySelector(suiteSelector(suiteName));
                removeClass(suiteListNode, "success");
                removeClass(suiteListNode, "failure");
                addClass(suiteListNode, "running");
                
                
                
                scrollToBottom();
            });
            
            on(test, "onSuiteEnd", function (suiteName) {
                var success = true;
                for (var testName in test.suites[suiteName]) {
                    success = success && test.suites[suiteName][testName].success;
                }
                
                var suite = testList.querySelector(suiteSelector(suiteName));
                addClass(suite, success ? "success" : "failure");
                removeClass(suite, "running");
                
                scrollToBottom();
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
                
                var testListNode = testList.querySelector(testSelector(suiteName, testName));
                removeClass(testListNode, "success");
                removeClass(testListNode, "failure");
                addClass(testListNode, "running");
                
                scrollToBottom();
            });
            
            on(test, "onTestEnd", function (suiteName, testName) {
                removeClass(testList.querySelector(testSelector(suiteName, testName)), "running");
                showLogTab();
                scrollToBottom();
            });
            
            on(test, "onSuccess", function (suiteName, testName) {
                var testNode = doc.createElement("div");
                testNode.className = "success";
                testNode.innerHTML = "[SUCCESS] '" + testName + "' - elapsed time: " +
                    test.suites[suiteName][testName].elapsedTime + "ms";
                
                logContent.querySelector(testSelector(suiteName, testName)).appendChild(testNode);
                
                addClass(testList.querySelector(testSelector(suiteName, testName)), "success");
            });
            
            on(test, "onFailure", function (suiteName, testName, error) {
                var testNode = doc.createElement("div");
                testNode.className = "failure";
                testNode.innerHTML = "[FAILURE] '" + testName + "' - elapsed time: " +
                    test.suites[suiteName][testName].elapsedTime + "ms";
                
                var errorNode = doc.createElement("div");
                errorNode.className = "error";
                errorNode.innerHTML = "Error: " + escape(error.message);
                testNode.appendChild(errorNode);
                
                var functionHeaderNode = doc.createElement("div");
                functionHeaderNode.className = "functionHeader";
                functionHeaderNode.innerHTML = "Failed test function: ";
                testNode.appendChild(functionHeaderNode);
                
                var functionNode = doc.createElement("div");
                functionNode.className = "function";
                functionNode.innerHTML = escape(this._formatFunction(this.suites[suiteName][testName].test));
                functionHeaderNode.appendChild(functionNode);
                
                if (error && (error.stack || error.stacktrace)) {
                    var stackHeaderNode = doc.createElement("div");
                    stackHeaderNode.className = "stackHeader";
                    stackHeaderNode.innerHTML = "Stack trace: ";
                    testNode.appendChild(stackHeaderNode);

                    var stackNode = doc.createElement("div");
                    stackNode.className = "stack";
                    stackNode.innerHTML = escape(error.stack || error.stacktrace);
                    stackHeaderNode.appendChild(stackNode);
                }
                
                logContent.querySelector(testSelector(suiteName, testName)).appendChild(testNode);
                addClass(testList.querySelector(testSelector(suiteName, testName)), "failure");
            });
            
            on(test, "onLog", function () {
                if (this.currentSuiteName && this.currentTestName) {
                    var logNode = doc.createElement("div");
                    logNode.className = "log";
                    logNode.innerHTML = escape(Array.prototype.join.call(arguments, " "));
                    logContent.querySelector(testSelector(this.currentSuiteName, this.currentTestName) +
                        " .testLog").appendChild(logNode);
                    
                    scrollToBottom();
                }
            });
            
            on(test, "onInfo", function () {
                if (this.currentSuiteName && this.currentTestName) {
                    var logNode = doc.createElement("div");
                    logNode.className = "info";
                    logNode.innerHTML = escape(Array.prototype.join.call(arguments, " "));
                    logContent.querySelector(testSelector(this.currentSuiteName, this.currentTestName) +
                        " .testLog").appendChild(logNode);
                    
                    scrollToBottom();
                }
            });
            
            on(test, "onError", function () {
                if (this.currentSuiteName && this.currentTestName) {
                    var logNode = doc.createElement("div");
                    logNode.className = "error";
                    logNode.innerHTML = escape(Array.prototype.join.call(arguments, " "));
                    logContent.querySelector(testSelector(this.currentSuiteName, this.currentTestName) +
                        " .testLog").appendChild(logNode);
                    
                    scrollToBottom();
                }
            });
            
            
            on(test, "onNewTestNode", function () {
                showTestPageTab();
            })
        }
    };
    
});