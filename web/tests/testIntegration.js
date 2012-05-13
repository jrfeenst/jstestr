
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
            var self = this;
            testr.click("#input1", function () {
            });
            
            testr.click("#input2", function (input) {
                assert.isEqual(input, self.document.activeElement, "Input 2 selected");
            });
            
            testr.click("#input3a", function (input) {
                assert.isTrue(input.checked, "Input 3a checked");
            });
            
            testr.click("#input3b", function (input) {
                assert.isTrue(input.checked, "Input 3b checked");
            });
            
            testr.click("#input4", function (input) {
                assert.isEqual(input, self.document.activeElement, "Input 4 selected");
            });
            
            testr.click("#input5");
            
            testr.type("abc123", "#input1", function (input) {
                assert.isEqual("abc123", input.value, "Text box typing");
            });
            
            testr.type("password", "#input4", function (input) {
                assert.isEqual("password", input.value, "Password field typing");
            });
            
            testr.type("this\nis a\nmultiline input", "#input7", function (input) {
                assert.isEqual("this\nis a\nmultiline input", input.value, "Multiline input");
            });
            
            testr.click("#input8b", function (input) {
                assert.isTrue(input.selected, "Option 8b selected");
            });
            
            testr.click("#input9c", function (input) {
                assert.isTrue(input.selected, "Option 9c selected");
            });
            testr.click("#input9b", function (input) {
                assert.isTrue(self.document.getElementById("input9c").selected, "Option 9c still selected");
                assert.isTrue(input.selected, "Option 9b selected");
            }, {ctrlKey: true});
            
            
            testr.click("#input10");
            
            testr.drag("#movable", "#div1", function (moveable, div) {
                var rect = div.getBoundingClientRect();
                assert.isEqual(Math.floor(rect.left + rect.width / 2 - 5) + "px",
                    moveable.style.left, "Moveable div x");
                assert.isEqual(Math.floor(rect.top + rect.height / 2 - 5) + "px",
                    moveable.style.top, "Moveable div y");
            });
            
            testr.move({element: "#paint", x: 10, y: 10}, {x: 150, y: 150});
            
            return testr.start();
        }
        
    });
});
