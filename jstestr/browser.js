
define([
    "./Queue"
], function (Queue) {
    
    var global = this;
    var browser = {};
    if (global.navigator && navigator.userAgent) {
        browser = {
    		msie: !!(global.attachEvent && !global.opera),
    		opera: !!global.opera,
    		webkit: navigator.userAgent.indexOf('AppleWebKit/') >= 0,
    		safari: navigator.userAgent.indexOf('AppleWebKit/') >= 0 &&
                    navigator.userAgent.indexOf('Chrome/') === -1,
    		gecko: navigator.userAgent.indexOf('Gecko') >= 0,
    		mobileSafari: !! navigator.userAgent.match(/Apple.*Mobile.*Safari/),
    		rhino: navigator.userAgent.match(/Rhino/) && true
    	};
    }
    
    var tests = [];
    
    function executeTests() {
        if (global.document && document.body) {
            var node, i;
            for (i = 0; i < tests.length; i++) {
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
    
    browser.addTest = function addTest(func) {
        tests.push(func);
        executeTests();
    };
    return browser;
});
