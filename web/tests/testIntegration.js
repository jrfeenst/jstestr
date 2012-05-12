
define([
    "require",
    "jstestr/assert",
    "jstestr/test",
    "jstestr/main"
], function (require, assert, test, jstestr) {
    test.defineSuite("Integration Test", {
        "pageUnderTest": require.toUrl("./integrationTestPage.html"),
        "timeout": 20000,
        
        "Click and Type": function () {
            var eventLog = [];
            var appendToLog = function appendToLog(message) {
                eventLog.push((new Date()).getTime() + ": " + message);
            };
            
            var testr = new jstestr({document: this.document, global: this.global});
            
            testr.query("#input1", function () {
                appendToLog("#input1 found");
            });
            
            testr.click("#input1", function () {
                appendToLog("input1 click done");
            });

            testr.click("#input2", function () {
                appendToLog("input2 click done");
            });

            testr.click("#input3a", function () {
                appendToLog("input3a click done");
            });

            testr.click("#input3b", function () {
                appendToLog("input3b click done");
            });

            testr.click("#input4", function () {
                appendToLog("input4 click done");
            });

            testr.click("#input5", function () {
                appendToLog("input5 click done");
            });

            //testr.click("#input6", function () {
            //    appendToLog("input7 click done");
            //});

            testr.type("abc123", "#input1", function () {
                appendToLog("input1 typing done");
            }, {keyDelay: 10});

            testr.type("password", "#input4", function () {
                appendToLog("input4 typing done");
            }, {keyDelay: 10});

            testr.type("this\nis a\nmultiline input", "#input7", function () {
                appendToLog("input7 typing done");
            }, {keyDelay: 10});

            testr.delay(500, function delay3() {
                appendToLog("Third delay done");
            });

            testr.click("#input5", function () {
                appendToLog("input 5 second click done");
            });

            testr.click("#input8b", function () {
                appendToLog("input 8b click done");
            });

            testr.click("#input9c", function () {
                appendToLog("input 9c click done");
            });
            testr.click("#input9b", function () {
                appendToLog("input 9b click done");
            }, {ctrlKey: true});


            testr.click("#input10", function () {
                appendToLog("input 10 click done")
            });

            testr.drag("#movable", "#div1", function () {
                appendToLog("movable drag done");
            });

            testr.move({element: "#paint", x: 10, y: 10}, {x: 150, y: 150}, function () {
                appendToLog("paint move done");
            });


            return testr.start();
        }
        
    });
});
