
define([
    "jstestr/assert",
    "jstestr/Event",
    "jstestr/Focus",
    "jstestr/Key",
    "jstestr/test"
], function (assert, Event, Focus, Key, test) {
    
    function assertType(k, str, expectedStr, expectedEvents, node) {
        var actualEvents = [];
        function eventHandler(ev) {
            actualEvents.push(ev.type.toLowerCase());
        }
        Event.on("keydown", node, eventHandler);
        Event.on("keypress", node, eventHandler);
        Event.on("textInput", node, eventHandler);
        Event.on("textinput", node, eventHandler);
        Event.on("input", node, eventHandler);
        Event.on("keyup", node, eventHandler);
        
        k.type(str, node, function (input) {
            assert.isEqual(node, input, "Argument is the node");
            if (node.value !== undefined) {
                assert.isEqual(expectedStr, node.value, "Node value: " + node.id);
            }
            assert.isEqual(expectedEvents, actualEvents, "Key events: " + node.id);
        });
    }
    
    
    test.defineSuite("Key", {
        "beforeEach": function () {
            this.k = new Key();
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
            
            if (this.k.browser.msie) {
                expected = ["keydown", "keypress", "textinput", "input", "keyup", "keydown",
                    "textinput", "input", "keyup", "keydown", "keypress", "textinput", "input", "keyup"];
            }
            assertType(this.k, "a[backspace]b", "b", expected, this.inputNode);
                        
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
