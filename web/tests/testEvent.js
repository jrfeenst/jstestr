
define([
    "jstestr/assert",
    "jstestr/event",
    "jstestr/test"
], function (assert, event, test) {
    var e = new event();
    
    test.defineSuite("Event", {
        "Defaults": function () {
            var e = new event();
            assert.assertTrue(e.defaultActions, "Has default actions");
            assert.assertTrue(e.eventDefaults, "Has event defaults");
        },
        
        "Create And Dispatch Event": function () {
            var testNode = test.getNewTestNode();
            
            var customEvent = e._createEvent("custom", testNode);
            
            var called = false;
            e.on("custom", testNode, function (ev) {
                called = true;
            });
            
            e._dispatchEvent(customEvent, testNode);
            
            assert.assertTrue(called, "Event listener should be called");
        },
        
        "Event With Default Action": function () {
            var testNode = test.getNewTestNode();
            
            var customEvent = e._createEvent("custom", testNode);
            
            var called = false;
            e.defaultActions.custom = function (ev) {
                called = true;
            };
            e._dispatchEvent(customEvent, testNode);
            
            assert.assertTrue(called, "Event listener should be called");
        },
        
        "Prevent Default Action": function () {
            var testNode = test.getNewTestNode();
            
            var customEvent = e._createEvent("custom", testNode);
            
            e.on("custom", testNode, function (ev) {
                ev.preventDefault();
            });
            
            var called = false;
            e.defaultActions.custom = function (ev) {
                called = true;
            };
            e._dispatchEvent(customEvent, testNode);
            
            assert.assertFalse(called, "Event listener should not be called");
        }
    });
});
