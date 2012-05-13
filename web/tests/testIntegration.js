
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
            var testr = new jstestr({document: this.document, global: this.global});
            
            testr.click("#input1", function () {
            });
            
            testr.click("#input2", function () {
            });
            
            testr.click("#input3a", function () {
            });
            
            testr.click("#input3b", function () {
            });
            
            testr.click("#input4", function () {
            });
            
            testr.click("#input5", function () {
            });
            
            //testr.click("#input6", function () {
            //});
            
            testr.type("abc123", "#input1", function () {
            }, {keyDelay: 10});
            
            testr.type("password", "#input4", function () {
            }, {keyDelay: 10});
            
            testr.type("this\nis a\nmultiline input", "#input7", function () {
            }, {keyDelay: 10});
            
            testr.click("#input5", function () {
            });
            
            testr.click("#input8b", function () {
            });
            
            testr.click("#input9c", function () {
            });
            testr.click("#input9b", function () {
            }, {ctrlKey: true});
            
            
            testr.click("#input10", function () {
            });
            
            testr.drag("#movable", "#div1", function () {
            });
            
            testr.move({element: "#paint", x: 10, y: 10}, {x: 150, y: 150}, function () {
            });
            
            return testr.start();
        }
        
    });
});
