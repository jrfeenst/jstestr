
define([
    "jstestr/Event"
], function (Event) {
    
    var template =
        '<div class="graphicalLogger">' +
            '<div id="top">' +
                '<button id="runAll">Run All</button>' +
                '<button id="reloadRunAll">Reload All</button>' +
                '<table id="testProgressBar" class="progressBar"><tbody><tr></tr></tbody></table>' +
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
        return '.suite[data-suiteName="' + suiteName + '"]';
    }

    function testSelector(suiteName, testName) {
        return '.test[data-suiteName="' + suiteName + '"]' + '[data-testName="' + testName + '"]';
    }
    
    
    var escape = function escape(str) {
      escape.text.data = str;
      return escape.div.innerHTML;
    };
    escape.div = document.createElement("div");
    escape.text = document.createTextNode("");
    escape.div.appendChild(escape.text);

    var win = this;
    
    return {
        listen: function(test, containerDiv) {
            var doc = containerDiv.ownerDocument;
                        
            containerDiv.innerHTML = template;
            if (win.navigator.userAgent.indexOf("MSIE 9") >= 0) {
                addClass(containerDiv.firstElementChild, "ie9");
            }
            
            test.setTestNodeParent(doc.getElementById("testPageContent"));
            
            
            // update the tabs
            var tabs = doc.getElementById("tabs");
            var tabContents = doc.getElementById("tabContents");
            var logContent = doc.getElementById("logContent");
            var testList = doc.getElementById("testList");
            var runAll = doc.getElementById("runAll");
            var reloadRunAll = doc.getElementById("reloadRunAll");
            var testProgressBar = doc.querySelector("#testProgressBar tr");
            
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
            
            
            Event.on("click", runAll, function () {
                test.runAll();
            });
            
            Event.on("click", reloadRunAll, function () {
                location.href = location.href.replace(/(&|\?)suite=[^&]+|(&|\?)test=[^&]+/, "");
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
                
                var runReloadNode = doc.createElement("button");
                runReloadNode.className = "run";
                runReloadNode.innerHTML = "Reload and Run";
                controlsNode.appendChild(runReloadNode);
                
                Event.on("click", runNode, function (ev) {
                    ev.preventDefault();
                    ev.stopPropagation();
                    if (testName) {
                        test.runTest(suiteName, testName);
                    } else {
                        test.runSuite(suiteName);
                    }
                });
                
                Event.on("click", runReloadNode, function (ev) {
                    ev.preventDefault();
                    ev.stopPropagation();
                    
                    var url = location.href;
                    url = url.replace(/(&|\?)suite=[^&]+|(&|\?)test=[^&]+/, "");
                    var sep = url.indexOf("?") < 0 ? "?" : "&";
                    var newQuery;
                    if (testName) {
                        newQuery = "test=" + escape(suiteName) + ":" + escape(testName);
                    } else {
                        newQuery = "suite=" + escape(suiteName);
                    }
                    location.href = url + sep + newQuery;
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
                
                Event.on("click", suiteNameNode, function () {
                    toggleControls(suiteNameNode);
                });
                
                return suiteNode;
            }
            
            function renderTest(suiteName, testName) {
                var testNode = doc.createElement("div");
                testNode.className = "test";
                testNode.setAttribute("data-suiteName", suiteName);
                testNode.setAttribute("data-testName", testName);
                testNode.innerHTML = testName;
                
                var suiteNode = testList.querySelector(suiteSelector(suiteName));
                suiteNode.appendChild(testNode);
                
                testNode.appendChild(renderControls(suiteName, testName));
                
                Event.on("click", testNode, function () {
                    var output = logContent.querySelector(testSelector(suiteName, testName));
                    if (output) {
                        output.scrollIntoView();
                    }
                    toggleControls(testNode);
                });

                var progressNode = doc.createElement("td");
                progressNode.className = "test";
                progressNode.setAttribute("data-suiteName", suiteName);
                progressNode.setAttribute("data-testName", testName);
                testProgressBar.appendChild(progressNode);

                Event.on("click", progressNode, function () {
                    testNode.scrollIntoView();
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
                
                if (test.successfulTests < test.totalTests) {
                    endNode.innerHTML = "[TESTS FAILED] ";
                    addClass(endNode, "failure");
                } else {
                    endNode.innerHTML = "[TESTS PASSED] ";
                    addClass(endNode, "success");
                }
                endNode.innerHTML += test.successfulTests + "/" + test.totalTests + " passed!";
                
                logContent.appendChild(endNode);
                
                showLogTab();
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
                
                var suiteListNode = doc.querySelector(suiteSelector(suiteName));
                removeClass(suiteListNode, "success");
                removeClass(suiteListNode, "failure");
                addClass(suiteListNode, "running");

                scrollToBottom();
            });
            
            on(test, "onSuiteEnd", function (suiteName) {
                var success = true;
                for (var testName in test.suites[suiteName]) {
                    success = success && test.suites[suiteName][testName].success !== false;
                }
                
                var suite = doc.querySelector(suiteSelector(suiteName));
                addClass(suite, success ? "success" : "failure");
                removeClass(suite, "running");
                
                scrollToBottom();
            });
            
            on(test, "onTestStart", function (suiteName, testName) {
                var testNode = doc.createElement("div");
                testNode.className = "test";
                testNode.setAttribute("data-suiteName", suiteName);
                testNode.setAttribute("data-testName", testName);
                
                var testStartNode = doc.createElement("div");
                testStartNode.className = "testStart";
                testStartNode.innerHTML = "Starting test: '" + testName + "'";
                testNode.appendChild(testStartNode);
                
                var testLogNode = doc.createElement("div");
                testLogNode.className = "testLog";
                testNode.appendChild(testLogNode);
                
                logContent.querySelector(suiteSelector(suiteName)).appendChild(testNode);
                
                // Update the test list css state
                var testListNode = testList.querySelector(testSelector(suiteName, testName));
                removeClass(testListNode, "success");
                removeClass(testListNode, "failure");
                addClass(testListNode, "running");
                
                // Update the progress bar state
                var testProgressNode = testProgressBar.querySelector(testSelector(suiteName, testName));
                removeClass(testProgressNode, "success");
                removeClass(testProgressNode, "failure");
                addClass(testProgressNode, "running");

                scrollToBottom();
            });
            
            on(test, "onTestEnd", function (suiteName, testName) {
                removeClass(testList.querySelector(testSelector(suiteName, testName)), "running");
                removeClass(testProgressBar.querySelector(testSelector(suiteName, testName)), "running");

                scrollToBottom();
            });
            
            on(test, "onSuccess", function (suiteName, testName) {
                var testNode = doc.createElement("div");
                testNode.className = "success";
                testNode.innerHTML = "[SUCCESS] '" + testName + "' - elapsed time: " +
                    test.suites[suiteName][testName].elapsedTime + "ms";
                
                logContent.querySelector(testSelector(suiteName, testName)).appendChild(testNode);
                
                addClass(testList.querySelector(testSelector(suiteName, testName)), "success");
                addClass(testProgressBar.querySelector(testSelector(suiteName, testName)), "success");
            });
            
            on(test, "onFailure", function (suiteName, testName, error) {
                var testPoint = test.suites[suiteName][testName];

                var testNode = doc.createElement("div");
                testNode.className = "failure";
                testNode.innerHTML = "[FAILURE] '" + testName + "' - elapsed time: " +
                        testPoint.elapsedTime + "ms";
                
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
                functionNode.innerHTML = escape(this._formatFunction(testPoint.test));
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

                if (testPoint.domSnapshot.length > 0) {
                    var snapshotNode = doc.createElement("div");
                    snapshotNode.className = "domSnapshot";
                    snapshotNode.innerHTML = "DOM Snapshots: ";
                    testNode.appendChild(snapshotNode);

                    function createSnapshotCallback(i) {
                        return function (ev) {
                            ev.preventDefault();
                            ev.stopPropagation();
                            
                            var domWindow = win.open("snapshot.html");
                            domWindow.onload = function () {
                                domWindow.document.open();
                                // strip out scripts so that they don't mess up the dom when run
                                domWindow.document.write(testPoint.domSnapshot[i].replace(
                                        /<script[\s\S]*?>[\s\S]*?<\/script>/g, "<!--removed $& -->"));
                                domWindow.document.close();
                            };
                        };
                    }

                    for (i = 0; i < testPoint.domSnapshot.length; i += 1) {
                        if (testPoint.domSnapshot[i]) {
                            var showSnapshot = doc.createElement("button");
                            showSnapshot.className = "showSnapshot";
                            showSnapshot.innerHTML = "Show DOM Snapshot";
                            snapshotNode.appendChild(showSnapshot);
                            
                            Event.on("click", showSnapshot, createSnapshotCallback(i));
                        }
                    }
                }

                logContent.querySelector(testSelector(suiteName, testName)).appendChild(testNode);
                addClass(testList.querySelector(testSelector(suiteName, testName)), "failure");
                addClass(testProgressBar.querySelector(testSelector(suiteName, testName)), "failure");
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
            });
            
            on(test, "onCleanTestNodes", function () {
                showLogTab();
            });
        }
    };
    
});