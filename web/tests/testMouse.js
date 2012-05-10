
define([
    "jstestr/assert",
    "jstestr/event",
    "jstestr/mouse",
    "jstestr/test"
], function (assert, event, mouse, test) {
    test.defineSuite("Mouse", {
        "beforeEach": function () {
            this.m = new mouse();
            this.node = test.getNewTestNode();
            
            this.button = document.createElement("button");
            this.node.appendChild(this.button);
            
            this.div = document.createElement("button");
            this.node.appendChild(this.button);
        },
        
        "Click Button": function () {
            var mockHandler = assert.createMockFunction();
            var clickListener = event.on("click", this.button, mockHandler);
            this.m.click(this.button, function () {
                mockHandler.verify("Handler should be called once");
                clickListener.remove();
            });
            this.m.start();
        },
        
        "Click DIV": function () {
            var mockHandler = assert.createMockFunction();
            var clickListener = event.on("click", this.div, mockHandler);
            this.m.click(this.div, function () {
                mockHandler.verify("Handler should be called once");
                clickListener.remove();
            });
            this.m.start();
        },
        
        "Drag": function () {
            this.m.start();
        },
        
        "Hover": function () {
            this.m.start();
        }
    });
});
