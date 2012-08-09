
define([
    "jstestr/assert",
    "jstestr/Event",
    "jstestr/Mouse",
    "jstestr/test"
], function (assert, Event, Mouse, test) {
    test.defineSuite("Mouse", {
        "beforeEach": function () {
            this.m = new Mouse();
            this.node = test.getNewTestNode();
        },
        
        "Click Button": function () {
            var button = document.createElement("button");
            this.node.appendChild(button);
            
            var downHandler = assert.createMockFunction();
            Event.on("mousedown", button, downHandler);
            var upHandler = assert.createMockFunction();
            Event.on("mouseup", button, upHandler);
            var clickHandler = assert.createMockFunction();
            Event.on("click", button, clickHandler);
            this.m.click(button, function (btn) {
                assert.isEqual(button, btn, "Node should be passed into the handler");
                downHandler.verify("Down handler should be called once");
                upHandler.verify("Up handler should be called once");
                clickHandler.verify("Click handler should be called once");
            });
            return this.m.start();
        },
        
        "Click DIV": function () {
            var div = document.createElement("div");
            this.node.appendChild(div);
            
            var mockHandler = assert.createMockFunction();
            Event.on("click", div, mockHandler);
            this.m.click(div, function () {
                mockHandler.verify("Handler should be called once");
            });
            return this.m.start();
        },
        
        "Click Link": function () {
            var a = document.createElement("a");
            this.node.appendChild(a);
            
            var mockHandler = assert.createMockFunction();
            Event.on("click", a, mockHandler);
            this.m.click(a, function () {
                mockHandler.verify("Handler should be called once");
            });
            
            return this.m.start();
        },
        
        "Click Checkbox": function () {
            var input = document.createElement("input");
            input.setAttribute("type", "checkbox");
            this.node.appendChild(input);
            
            var mockHandler = assert.createMockFunction();
            Event.on("click", input, mockHandler);
            
            this.m.click(input, function () {
                mockHandler.verify("Handler should be called once");
                assert.isTrue(input.checked, "Checkbox should be checked");
                mockHandler.reset();
            });
            
            this.m.click(input, function () {
                mockHandler.verify("Handler should be called once");
                assert.isFalse(input.checked, "Checkbox should be unchecked");
            });
            
            return this.m.start();
        },
        
        "Click Radio": function () {
            var inputA = document.createElement("input");
            inputA.setAttribute("type", "radio");
            inputA.setAttribute("name", "radio");
            this.node.appendChild(inputA);
            
            var inputB = document.createElement("input");
            inputB.setAttribute("type", "radio");
            inputB.setAttribute("name", "radio");
            this.node.appendChild(inputB);
            
            var mockHandlerA = assert.createMockFunction();
            Event.on("click", inputA, mockHandlerA);
            var mockHandlerB = assert.createMockFunction();
            Event.on("click", inputB, mockHandlerB);
            
            this.m.click(inputA, function () {
                mockHandlerA.verify("Handler A should be called once");
                assert.isTrue(inputA.checked, "Radio A should be checked");
                assert.isFalse(inputB.checked, "Radio B should be unchecked");
            });
            
            this.m.click(inputB, function () {
                mockHandlerB.verify("Handler B should be called once");
                assert.isFalse(inputA.checked, "Radio A should be checked");
                assert.isTrue(inputB.checked, "Radio B should be unchecked");
            });
            
            return this.m.start();
        },
        
        "Double Click": function () {
            var div = document.createElement("div");
            this.node.appendChild(div);
            
            var clickHandler = assert.createMockFunction();
            clickHandler.times(2);
            Event.on("click", div, clickHandler);
            var doubleClickHandler = assert.createMockFunction();
            Event.on("dblclick", div, doubleClickHandler);
            this.m.doubleClick(div, function () {
                clickHandler.verify("Handler should be called twice");
                doubleClickHandler.verify("Double click should be called");
            });
            return this.m.start();
        },
        
        "Hover": function () {
            var div = document.createElement("div");
            this.node.appendChild(div);
            var hovered = false;
            var timeout;
            Event.on("mousemove", div, function () {
                clearTimeout(timeout);
                timeout = setTimeout(function () {
                    hovered = true;
                }, 25);
            });
            this.m.hover(div, function (node) {
                assert.isEqual(div, node, "Argument is the node");
                assert.isTrue(hovered, "The hover timeout should fire");
            }, {timeout: 50});
            return this.m.start();
        },
        
        "Drag": function () {
            this.node.style.position = "relative";
            this.node.id = "testNode";
            this.node.style.width = "100px";
            this.node.style.height = "50px";
            this.node.style.backgroundColor = "lightgray";
            
            var pos = this.node.getBoundingClientRect();
            
            var divA = document.createElement("div");
            divA.id = "testDivA";
            divA.style.position = "absolute";
            divA.style.left = "1px";
            divA.style.top = "5px";
            divA.style.width = "44px";
            divA.style.height = "40px";
            divA.style.backgroundColor = "gray";
            this.node.appendChild(divA);
            
            var divB = document.createElement("div");
            divB.id = "testDivB";
            divB.style.position = "absolute";
            divB.style.left = "55px";
            divB.style.top = "5px";
            divB.style.width = "44px";
            divB.style.height = "40px";
            divB.style.backgroundColor = "gray";
            this.node.appendChild(divB);
            
            var events = [];
            function eventHandler(ev) {
                events.push({
                    type: ev.type,
                    x: ev.clientX - Math.round(pos.left),
                    y: ev.clientY - Math.round(pos.top),
                    id: ev.target.id
                });
            }
            Event.on("mousedown", this.node, eventHandler);
            Event.on("mousemove", this.node, eventHandler);
            Event.on("mouseover", this.node, eventHandler);
            Event.on("mouseout", this.node, eventHandler);
            Event.on("mouseup", this.node, eventHandler);
            
            var expected = [
                {"type": "mouseover", "x": 23, "y": 25, "id": "testDivA"},
                {"type": "mousedown", "x": 23, "y": 25, "id": "testDivA"},
                {"type": "mousemove", "x": 23, "y": 25, "id": "testDivA"},
                {"type": "mousemove", "x": 28, "y": 25, "id": "testDivA"},
                {"type": "mousemove", "x": 33, "y": 25, "id": "testDivA"},
                {"type": "mousemove", "x": 38, "y": 25, "id": "testDivA"},
                {"type": "mousemove", "x": 43, "y": 25, "id": "testDivA"},
                {"type": "mouseout", "x": 48, "y": 25, "id": "testDivA"},
                {"type": "mouseover", "x": 48, "y": 25, "id": "testNode"},
                {"type": "mousemove", "x": 48, "y": 25, "id": "testNode"},
                {"type": "mousemove", "x": 53, "y": 25, "id": "testNode"},
                {"type": "mouseout", "x": 58, "y": 25, "id": "testNode"},
                {"type": "mouseover", "x": 58, "y": 25, "id": "testDivB"},
                {"type": "mousemove", "x": 58, "y": 25, "id": "testDivB"},
                {"type": "mousemove", "x": 63, "y": 25, "id": "testDivB"},
                {"type": "mousemove", "x": 68, "y": 25, "id": "testDivB"},
                {"type": "mousemove", "x": 73, "y": 25, "id": "testDivB"},
                {"type": "mousemove", "x": 77, "y": 25, "id": "testDivB"},
                {"type": "mouseup", "x": 77, "y": 25, "id": "testDivB"}
            ];
            
            this.m.drag(divA, divB, function (nodeA, nodeB) {
                assert.isEqual(divA, nodeA, "Argument 0 is the node");
                assert.isEqual(divB, nodeB, "Argument 1 is the node");
                assert.isEqual(expected, events, "Move, over, out events should be right");
            });
            
            return this.m.start();
        }
    });
});
