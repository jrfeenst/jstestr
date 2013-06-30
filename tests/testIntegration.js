
define([
    "require",
    "jstestr/assert",
    "jstestr/test",
    "jstestr/Synthetic"
], function (require, assert, test, Synthetic) {
    test.defineSuite("Integration Test", {
        "pageUnderTest": require.toUrl("./integrationTestPage.html"),
        "timeout": 20000,

        "Click and Type": function () {
            var synth = new Synthetic({document: this.document, global: this.global});
            var self = this;
            synth.click("#input1");

            synth.click("#input2", function (input) {
                assert.isEqual(input, self.document.activeElement, "Input 2 selected");
            });

            synth.click("#input3a", function (input) {
                assert.isTrue(input.checked, "Input 3a checked");
            });

            synth.click("#input3b", function (input) {
                assert.isTrue(input.checked, "Input 3b checked");
            });

            synth.click("#input4", function (input) {
                assert.isEqual(input, self.document.activeElement, "Input 4 selected");
            });

            synth.click("#input5");

            synth.type("abc123", "#input1", function (input) {
                assert.isEqual("abc123", input.value, "Text box typing");
            });

            synth.type("password", "#input4", function (input) {
                assert.isEqual("password", input.value, "Password field typing");
            });

            synth.type("this\nis a\nmultiline input", "#input7", function (input) {
                assert.isEqual("this\nis a\nmultiline input", input.value, "Multiline input");
            });

            synth.click("#input8b", function (input) {
                assert.isTrue(input.selected, "Option 8b selected");
            });

            synth.click("#input9c", function (input) {
                assert.isTrue(input.selected, "Option 9c selected");
            });
            synth.click("#input9b", function (input) {
                assert.isTrue(self.document.getElementById("input9c").selected, "Option 9c still selected");
                assert.isTrue(input.selected, "Option 9b selected");
            }, {ctrlKey: true});


            synth.click("#input10");

            synth.drag("#movable", "#div1", function (moveable, div) {
                var rect = div.getBoundingClientRect();
                assert.isEqual(Math.round(rect.left + rect.width / 2 - 5) + "px",
                    moveable.style.left, "Moveable div x");
                assert.isEqual(Math.round(rect.top + rect.height / 2 - 5) + "px",
                    moveable.style.top, "Moveable div y");
            });

            synth.move({element: "#paint", x: 10, y: 10}, {x: 150, y: 150});

            return synth.start();
        }

    });
});
