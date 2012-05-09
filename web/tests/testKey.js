
define([
    "jstestr/assert",
    "jstestr/event",
    "jstestr/focus",
    "jstestr/key",
    "jstestr/test"
], function (assert, event, focus, key, test) {
    
    function assertType(k, str, expectedStr, expectedEvents, node) {
        var actualEvents = [];
        var downListener = event.on("keydown", node, function (ev) {
            actualEvents.push(ev.type);
        });
        var pressListener = event.on("keypress", node, function (ev) {
            actualEvents.push(ev.type);
        });
        var textInputListener = event.on("textInput", node, function (ev) {
            actualEvents.push(ev.type.toLowerCase());
        });
        var textinputListener = event.on("textinput", node, function (ev) {
            actualEvents.push(ev.type);
        });
        var inputListener = event.on("input", node, function (ev) {
            actualEvents.push(ev.type);
        });
        var upListener = event.on("keyup", node, function (ev) {
            actualEvents.push(ev.type);
        });

        k.type(str, node, function () {
            if (node.value !== undefined) {
                assert.assertEquals(expectedStr, node.value, "Node value: " + node.id);
            }
            assert.assertEquals(expectedEvents, actualEvents, "Key events: " + node.id);
            
            downListener.remove();
            pressListener.remove();
            textInputListener.remove();
            textinputListener.remove();
            inputListener.remove();
            upListener.remove();
        });
    }
    
    
    test.defineSuite("Key", {
        "beforeEach": function () {
            this.k = new key();
            this.node = test.getNewTestNode();
            
            this.inputNode = document.createElement("input");
            this.inputNode.id = "inputNode";
            this.inputNode.setAttribute("type", "text");
            this.node.appendChild(this.inputNode);
            
            this.passwordNode = document.createElement("input");
            this.passwordNode.id = "passwordNode";
            this.passwordNode.setAttribute("type", "password");
            this.node.appendChild(this.passwordNode);
            
            this.textareaNode = document.createElement("textarea");
            this.textareaNode.id = "textareaNode";
            this.node.appendChild(this.textareaNode);
            
            this.divNode = document.createElement("div");
            this.divNode.id = "divNode";
            this.node.appendChild(this.divNode);
        },
        
        "ASCI Into Inputs": function () {
            var str = "abcz-ABCZ_0129";
            
            var expected = [];
            for (var i = 0; i < str.length; i++) {
                expected = expected.concat(["keydown", "keypress", "textinput", "input", "keyup"]);
            }
            
            assertType(this.k, str, str, expected, this.inputNode);
            assertType(this.k, str, str, expected, this.passwordNode);
            assertType(this.k, str, str, expected, this.textareaNode);
            
            return this.k.start();
        },
        
        "Backspace": function () {
            var expected = ["keydown", "keypress", "textinput", "input", "keyup", "keydown",
                "input", "keyup", "keydown", "keypress", "textinput", "input", "keyup"];
            assertType(this.k, "a[backspace]b", "b", expected, this.textareaNode);
            
            return this.k.start();
        },
        
        "ASCI Into DIV": function () {
            var str = "abcz-ABCZ_0129";
            
            var expected = [];
            for (var i = 0; i < str.length; i++) {
                expected = expected.concat(["keydown", "keypress", "keyup"]);
            }
            
            assertType(this.k, str, str, expected, this.divNode);
            
            return this.k.start();
        }
    });
});
