
define([
    "jstestr/assert",
    "jstestr/dom",
    "jstestr/test"
], function (assert, dom, test) {
    test.defineSuite("Dom", {
        beforeEach: function () {
            this.node = test.getNewTestNode({timeout: 200});
            
            this.testNode1 = document.createElement("div");
            this.testNode1.setAttribute("id", "testNode1");
            this.testNode1.className = "testNode testNode1";
            this.node.appendChild(this.testNode1);
            
            this.testNode2 = document.createElement("div");
            this.testNode2.setAttribute("id", "testNode2");
            this.testNode2.className = "testNode testNode2";
            this.node.appendChild(this.testNode2);
            
            this.dom = new dom();
        },
        
        "Query All": function () {
            var self = this;
            this.dom.queryAll(".testNode", 2, function (nodes) {
                assert.assertEquals(self.testNode1, nodes[0], "Node 1 should be found");
                assert.assertEquals(self.testNode2, nodes[1], "Node 2 should be found");
            });
            
            this.dom.queryAll(".nonexistant", 0, function (nodes) {
                assert.assertEquals(0, nodes.length, "No nodes should be found");
            });
            return this.dom.start();
        },
        
        "Query All Fail": function (done) {
            this.dom.queryAll(".testNode", 3, null, {timeout: 50});
            this.dom.start().then(function () {
                done("Should not find the node");
            }, function () {
                done(true);
            });
        },
        
        "Count Strings": function () {
            var self = this;
            function assertQuery(count) {
                self.dom.queryAll(".testNode", count, function (nodes) {
                    assert.assertEquals(self.testNode1, nodes[0], "Node 1 should be found: " + count);
                    assert.assertEquals(self.testNode2, nodes[1], "Node 2 should be found: " + count);
                });
            }
            
            assertQuery("=2");
            assertQuery(" > 1 ");
            assertQuery(" <3  ");
            assertQuery(" >0   & < 3 ");
            assertQuery(" > 1 & = 2 ");
            assertQuery(" > 1 & < 3 & <5  ");
            assertQuery(" > 2 | < 3 & <5  ");
            assertQuery(" < 2 | > 2 | =2");
            
            return this.dom.start();
        },
        
        "Query All With Delay": function () {
            var testNode3 = document.createElement("div");
            testNode3.className = "testNode testNode3";
            
            setTimeout(function () {
                self.node.appendChild(testNode3);
            }, 20);
            
            var self = this;
            this.dom.queryAll(".testNode", 3, function (nodes) {
                assert.assertEquals(self.testNode1, nodes[0], "Node 1 should be found");
                assert.assertEquals(self.testNode2, nodes[1], "Node 2 should be found");
                assert.assertEquals(testNode3, nodes[2], "Node 3 should be found");
            });
            return this.dom.start();
        },
        
        "Query": function () {
            var self = this;
            this.dom.query(".testNode", function (node) {
                assert.assertEquals(self.testNode1, node, "Node 1 should be found");
            });
            this.dom.query(".testNode2", function (node) {
                assert.assertEquals(self.testNode2, node, "Node 2 should be found");
            });
            return this.dom.start();
        },
        
        "By ID": function () {
            var self = this;
            this.dom.byId("testNode1", function (node) {
                assert.assertEquals(self.testNode1, node, "Node 1 should be found");
            });
            this.dom.byId("testNode2", function (node) {
                assert.assertEquals(self.testNode2, node, "Node 2 should be found");
            });
            return this.dom.start();
        },
        
        "Scoped Query": function () {
            var childNode1 = document.createElement("div");
            childNode1.className = "childNode childNode1";
            this.testNode1.appendChild(childNode1);
            
            var childNode2 = document.createElement("div");
            childNode2.className = "childNode childNode2";
            this.testNode1.appendChild(childNode2);
            
            this.dom.query(".childNode1", function (node) {
                assert.assertEquals(childNode1, node, "Child 1 should be found");
            }, {scopeElement: this.testNode1});
            
            this.dom.query(".childNode2", function (node) {
                assert.assertEquals(childNode2, node, "Child 2 should be found");
            }, {scopeElement: this.testNode1});
            
            this.dom.queryAll(".childNode", 0, function (nodes) {
                assert.assertEquals(0, nodes.length, "No nodes should be found");
            }, {scopeElement: this.testNode2});
            
            return this.dom.start();
        }
    });
})