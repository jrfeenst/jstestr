
define([
    "jstestr/assert",
    "jstestr/Key",
    "jstestr/Mouse",
    "jstestr/Option",
    "jstestr/test"
], function (assert, Key, Mouse, Option, test) {
    
    test.defineSuite("Option", {
        "beforeEach": function () {
            this.node = test.getNewTestNode();
            
            this.node.innerHTML = 
                '<select id="selectNode" multiple="multiple" size="4">' +
                    '<option id="option1" label="option1" value="option1">option1</option>' +
                    '<option id="option2" label="option2" value="option2">option2</option>' +
                    '<option id="option3" label="option3" value="option3">option3</option>' +
                '</select>';
            
            this.select = document.getElementById("selectNode");
            this.option1 = document.getElementById("option1");
            this.option2 = document.getElementById("option2");
            this.option3 = document.getElementById("option3");
        },
        
        "Click To Change": function () {
            var m = new Mouse();
            var self = this;
            
            m.click(this.option1, function () {
                assert.isTrue(self.option1.selected, "Option1 selected");
                assert.isFalse(self.option2.selected, "Option2 not selected");
                assert.isFalse(self.option3.selected, "Option3 not selected");
            });
            
            m.click(this.option2, function () {
                assert.isFalse(self.option1.selected, "Option1 not selected");
                assert.isTrue(self.option2.selected, "Option2 selected");
                assert.isFalse(self.option3.selected, "Option3 not selected");
            });
            
            m.click(this.option3, function () {
                assert.isFalse(self.option1.selected, "Option1 not selected");
                assert.isFalse(self.option2.selected, "Option2 not selected");
                assert.isTrue(self.option3.selected, "Option3 selected");
            });
            
            return m.start();
        },
        
        "Shift Click To Change": function () {
            var m = new Mouse();
            var self = this;
            
            m.click(this.option1, function () {
                assert.isTrue(self.option1.selected, "Option1 selected");
                assert.isFalse(self.option2.selected, "Option2 not selected");
                assert.isFalse(self.option3.selected, "Option3 not selected");
            });
            
            m.click(this.option3, function () {
                assert.isTrue(self.option1.selected, "Option1 selected");
                assert.isTrue(self.option2.selected, "Option2 selected");
                assert.isTrue(self.option3.selected, "Option3 selected");
            }, {shiftKey: true});
            
            m.click(this.option2, function () {
                assert.isTrue(self.option1.selected, "Option1 selected");
                assert.isTrue(self.option2.selected, "Option2 selected");
                assert.isFalse(self.option3.selected, "Option3 not selected");
            }, {shiftKey: true});
            
            return m.start();
        },
        
        "Ctrl Click To Change": function () {
            var m = new Mouse();
            var self = this;
            
            m.click(this.option1, function () {
                assert.isTrue(self.option1.selected, "Option1 selected");
                assert.isFalse(self.option2.selected, "Option2 not selected");
                assert.isFalse(self.option3.selected, "Option3 not selected");
            });
            
            m.click(this.option3, function () {
                assert.isTrue(self.option1.selected, "Option1 selected");
                assert.isFalse(self.option2.selected, "Option2 not selected");
                assert.isTrue(self.option3.selected, "Option3 selected");
            }, {ctrlKey: true});
            
            m.click(this.option2, function () {
                assert.isTrue(self.option1.selected, "Option1 selected");
                assert.isTrue(self.option2.selected, "Option2 selected");
                assert.isTrue(self.option3.selected, "Option3 selected");
            }, {ctrlKey: true});
            
            m.click(this.option1, function () {
                assert.isFalse(self.option1.selected, "Option1 not selected");
                assert.isTrue(self.option2.selected, "Option2 selected");
                assert.isTrue(self.option3.selected, "Option3 selected");
            }, {ctrlKey: true});
            
            return m.start();
        },
        
        "Arrow Keys To Change": function () {
            var m = new Mouse();
            var self = this;
            
            m.click(this.option1, function () {
                assert.isTrue(self.option1.selected, "Option1 selected");
                assert.isFalse(self.option2.selected, "Option2 not selected");
                assert.isFalse(self.option3.selected, "Option3 not selected");
            });
            
            m.type("[down]", this.select, function () {
                assert.isFalse(self.option1.selected, "Option1 not selected");
                assert.isTrue(self.option2.selected, "Option2 selected");
                assert.isFalse(self.option3.selected, "Option3 not selected");
            });
            
            m.type("[up]", this.select, function () {
                assert.isTrue(self.option1.selected, "Option1 selected");
                assert.isFalse(self.option2.selected, "Option2 not selected");
                assert.isFalse(self.option3.selected, "Option3 not selected");
            });
            
            return m.start();
        },
        
        "Shift Arrow Keys To Change": function () {
            var m = new Mouse();
            var self = this;
            
            m.click(this.option1, function () {
                assert.isTrue(self.option1.selected, "Option1 selected");
                assert.isFalse(self.option2.selected, "Option2 not selected");
                assert.isFalse(self.option3.selected, "Option3 not selected");
            });
            
            m.type("[down]", this.select, function () {
                assert.isTrue(self.option1.selected, "Option1 selected");
                assert.isTrue(self.option2.selected, "Option2 selected");
                assert.isFalse(self.option3.selected, "Option3 not selected");
            }, {shiftKey: true});
            
            m.type("[down]", this.select, function () {
                assert.isTrue(self.option1.selected, "Option1 selected");
                assert.isTrue(self.option2.selected, "Option2 selected");
                assert.isTrue(self.option3.selected, "Option3 selected");
            }, {shiftKey: true});
            
            m.type("[up]", this.select, function () {
                assert.isTrue(self.option1.selected, "Option1 selected");
                assert.isTrue(self.option2.selected, "Option2 selected");
                assert.isFalse(self.option3.selected, "Option3 not selected");
            }, {shiftKey: true});
            
            return m.start();
        }
    });
});
