
define([
    "jstestr/assert",
    "jstestr/Focus",
    "jstestr/Mouse",
    "jstestr/test"
], function (assert, Focus, Mouse, test) {
    test.defineSuite("Focus", {
        "beforeEach": function () {
            this.node = test.getNewTestNode();
            
            this.textArea1 = document.createElement("textarea");
            this.textArea1.id = "testArea1";
            this.textArea1.setAttribute("tabIndex", 10001);
            this.node.appendChild(this.textArea1);
            this.textArea1.focus();
            
            this.textArea2 = document.createElement("textarea");
            this.textArea2.id = "testArea2";
            this.textArea2.setAttribute("tabIndex", 10000);
            this.node.appendChild(this.textArea2);
        },
        
        "Click to Focus": function () {
            var m = new Mouse();
            var self = this;
            
            var expectedOrder = [];
            var order = [];
            
            expectedOrder.push("blur");
            m.on("blur", this.textArea1, function (ev) {
                assert.isEqual(self.textArea1, ev.target, "Text area 1 should blur");
                order.push(ev.type);
            });
            
            expectedOrder.push("focus");
            m.on("focus", this.textArea2, function (ev) {
                assert.isEqual(self.textArea2, ev.target, "Text area 2 should focus");
                order.push(ev.type);
            });
            
            m.click(this.textArea2, function () {
                assert.isEqual(self.textArea2, document.activeElement, "Should be focused");
                assert.isEqual(expectedOrder, order, "Expected event order");
            });
            
            return m.start();
        },
        
        "Tab Focus": function () {
            // todo: add support for tab focus
        }
    });
});
