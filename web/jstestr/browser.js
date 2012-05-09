
define([
    "./queue"
], function (queue) {
    
    queue.prototype.browser = {};
    
    var tests = [];
    
    function executeTests() {
        if (document && document.body) {
            var node;
            for (var i = 0; i < tests.length; i++) {
                node = document.createElement("div");
                node.style.position = "absolute";
                node.style.left = "-10000px";
                node.style.top = "-10000px";
                document.body.appendChild(node);
                try {
                    tests[i](node);
                } catch (e) {
                    console.error("Error while testing browser support: " + e.message);
                }
                document.body.removeChild(node);
            }
            tests = [];
        } else {
            setTimeout(executeTests, 0);
        }
    }
    
    setTimeout(executeTests, 0);
    
    return {
        addTest: function addTest(func) {
            tests.push(func);
            executeTests();
        }
    };
});
