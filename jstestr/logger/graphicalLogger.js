
define([
    "require"
], function (require) {
    
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
    
    
    function addClass(element, className) {
        element.className += ' ' + className;
    }
    
    function removeClass(element, className) {
        var classes = element.className.split(' ');
        var i = classes.indexOf(className);
        if (i >= 0) {
            classes.splice(i, 1);
            element.className = classes.join(' ');
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
    
    
    function escape(str) {
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
            
            function scrollToBottom() {
                tabContents.scrollTop = tabContents.scrollHeight;
            }
            
            runAll.addEventListener("click", function () {
                test.runAll();
            });
            
            reloadRunAll.addEventListener("click", function () {
                location.href = location.href.replace(/(&|\?)suite=[^&]+|(&|\?)suites=[^&]+|(&|\?)test=[^&]+/, "");
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
                
                runNode.addEventListener("click", function (ev) {
                    ev.preventDefault();
                    ev.stopPropagation();
                    if (testName) {
                        test.runTest(suiteName, testName);
                    } else {
                        test.runSuite(suiteName);
                    }
                });
                
                runReloadNode.addEventListener("click", function (ev) {
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
            
            
            function renderSuite(suiteName, index) {
                var suiteNode = doc.createElement("div");
                suiteNode.className = "suite";
                suiteNode.setAttribute("data-suiteName", suiteName);
                
                var suiteNameNode = doc.createElement("div");
                suiteNameNode.className = "suiteName";
                suiteNameNode.innerHTML = suiteName;
                suiteNode.appendChild(suiteNameNode);

                var progressNode = doc.createElement("td");
                progressNode.className = "suite";
                progressNode.setAttribute("data-suiteName", suiteName);
                
                if (index < testList.children.length) {
                    testList.insertBefore(suiteNode, testList.children[index]);
                    testProgressBar.insertBefore(progressNode, testProgressBar.children[index]);
                } else {
                    testList.appendChild(suiteNode);
                    testProgressBar.appendChild(progressNode);
                }
                
                suiteNameNode.appendChild(renderControls(suiteName));
                
                suiteNameNode.addEventListener("click", function () {
                    toggleControls(suiteNameNode);
                });
                
                return suiteNode;
            }
            
            function renderTest(suiteName, testName, test, index) {
                var testNode = doc.createElement("div");
                testNode.className = "test";
                testNode.setAttribute("data-suiteName", suiteName);
                testNode.setAttribute("data-testName", testName);
                testNode.innerHTML = testName;
                testNode.appendChild(renderControls(suiteName, testName));

                var progressNode = doc.createElement("td");
                progressNode.className = "test";
                progressNode.setAttribute("data-suiteName", suiteName);
                progressNode.setAttribute("data-testName", testName);
                

                var suiteNode = testList.querySelector(suiteSelector(suiteName));
                if (index + 1 < suiteNode.children.length) {
                    suiteNode.insertBefore(testNode, suiteNode.children[index + 1]);
                } else {
                    suiteNode.appendChild(testNode);
                }

                var suiteProgressNode = testProgressBar.querySelector(suiteSelector(suiteName));
                if (index < suiteProgressNode.children.length) {
                    suiteProgressNode.insertBefore(progressNode, suiteProgressNode.children[index]);
                } else {
                    suiteProgressNode.appendChild(progressNode);
                }
                
                testNode.addEventListener("click", function () {
                    var output = logContent.querySelector(testSelector(suiteName, testName));
                    if (output) {
                        output.scrollIntoView();
                    }
                    toggleControls(testNode);
                });

                progressNode.addEventListener("click", function () {
                    testNode.scrollIntoView();
                    var output = logContent.querySelector(testSelector(suiteName, testName));
                    if (output) {
                        output.scrollIntoView();
                    }
                    toggleControls(testNode);
                });
            }
            
            for (var suiteName in test.suites) {
                renderSuite(suiteName, test.suiteOrder.indexOf(suiteName));
                
                var suite = test.suites[suiteName];
                for (var testName in suite) {
                    renderTest(suiteName, testName, suite[testName],
                            test.testOrder[suiteName].indexOf(testName));
                }
            }
            
            test.on("onSuiteDefined", renderSuite);
            test.on("onTestDefined", renderTest);
            
            test.on("onStart", function () {
                logContent.innerHTML = "";
            });
            
            test.on("onEnd", function () {
                var endNode = doc.createElement("div");
                endNode.className = "results";
                
                if (test.successfulTests + test.ignoredTests < test.totalTests) {
                    endNode.innerHTML = "[TESTS FAILED] ";
                    addClass(endNode, "failure");
                } else {
                    endNode.innerHTML = "[TESTS PASSED] ";
                    addClass(endNode, "success");
                }
                endNode.innerHTML += test.successfulTests + "/" + test.totalTests + " passed, " + test.ignoredTests + " ignored!";
                
                logContent.appendChild(endNode);
                
                showLogTab();
                scrollToBottom();
            });
            
            test.on("onSuiteStart", function (suiteName) {
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

                suiteListNode.scrollIntoView(false);
                scrollToBottom();
            });
            
            test.on("onSuiteEnd", function (suiteName) {
                var success = true;
                for (var testName in test.suites[suiteName]) {
                    success = success && test.suites[suiteName][testName].success !== false;
                }
                
                var suite = testList.querySelector(suiteSelector(suiteName));
                addClass(suite, success ? "success" : "failure");
                removeClass(suite, "running");
                
                scrollToBottom();
            });
            
            test.on("onTestStart", function (suiteName, testName) {
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
            
            test.on("onTestEnd", function (suiteName, testName) {
                removeClass(testList.querySelector(testSelector(suiteName, testName)), "running");
                removeClass(testProgressBar.querySelector(testSelector(suiteName, testName)), "running");

                scrollToBottom();
            });
            
            test.on("onSuccess", function (suiteName, testName) {
                var testNode = doc.createElement("div");
                testNode.className = "success";
                testNode.innerHTML = "[SUCCESS] '" + testName + "' - elapsed time: " +
                    test.suites[suiteName][testName].elapsedTime + "ms";
                
                logContent.querySelector(testSelector(suiteName, testName)).appendChild(testNode);
                
                addClass(testList.querySelector(testSelector(suiteName, testName)), "success");
                addClass(testProgressBar.querySelector(testSelector(suiteName, testName)), "success");
            });
            
            test.on("onFailure", function (suiteName, testName, error) {
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
                            
                            var domWindow = win.open(require.toUrl("./snapshot.html"));
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
                            
                            showSnapshot.addEventListener("click", createSnapshotCallback(i));
                        }
                    }
                }

                logContent.querySelector(testSelector(suiteName, testName)).appendChild(testNode);
                addClass(testList.querySelector(testSelector(suiteName, testName)), "failure");
                addClass(testProgressBar.querySelector(testSelector(suiteName, testName)), "failure");
            });
            
            test.on("onIgnore", function (suiteName, testName) {
                var testNode = doc.createElement("div");
                testNode.className = "ignore";
                testNode.innerHTML = "[IGNORE] '" + testName + "' - elapsed time: " +
                    test.suites[suiteName][testName].elapsedTime + "ms";
                
                logContent.querySelector(testSelector(suiteName, testName)).appendChild(testNode);
                
                addClass(testList.querySelector(testSelector(suiteName, testName)), "ignore");
                addClass(testProgressBar.querySelector(testSelector(suiteName, testName)), "ignore");
            });
            
            test.on("onLog", function () {
                if (this.currentSuiteName && this.currentTestName) {
                    var logNode = doc.createElement("div");
                    logNode.className = "log";
                    logNode.innerHTML = escape(Array.prototype.join.call(arguments, " "));
                    logContent.querySelector(testSelector(this.currentSuiteName, this.currentTestName) +
                        " .testLog").appendChild(logNode);
                    
                    scrollToBottom();
                }
            });
            
            test.on("onInfo", function () {
                if (this.currentSuiteName && this.currentTestName) {
                    var logNode = doc.createElement("div");
                    logNode.className = "info";
                    logNode.innerHTML = escape(Array.prototype.join.call(arguments, " "));
                    logContent.querySelector(testSelector(this.currentSuiteName, this.currentTestName) +
                        " .testLog").appendChild(logNode);
                    
                    scrollToBottom();
                }
            });
            
            test.on("onError", function () {
                if (this.currentSuiteName && this.currentTestName) {
                    var logNode = doc.createElement("div");
                    logNode.className = "error";
                    logNode.innerHTML = escape(Array.prototype.join.call(arguments, " "));
                    logContent.querySelector(testSelector(this.currentSuiteName, this.currentTestName) +
                        " .testLog").appendChild(logNode);
                    
                    scrollToBottom();
                }
            });
            
            
            test.on("onNewTestNode", function () {
                showTestPageTab();
            });
            
            test.on("onCleanTestNodes", function () {
                showLogTab();
            });
        }
    };
    
});