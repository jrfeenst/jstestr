
define([
    "jstestr/assert",
    "jstestr/event",
    "jstestr/test"
], function (assert, event, test) {
    
    test.defineSuite("Event", {
        "Defaults": function () {
            var e = new event();
            assert.assertTrue(e.defaultActions, "Has default actions");
            assert.assertTrue(e.eventDefaults, "Has event defaults");
        },
        
        "Create And Dispatch Event": function () {
            var e = new event();
            var testNode = test.getNewTestNode();
            
            var customEvent = e._createEvent("custom", testNode);
            
            var called = false;
            e.on("custom", testNode, function (ev) {
                called = true;
            });
            
            e._dispatchEvent(customEvent, testNode);
            
            assert.assertTrue(called, "Event listener should be called");
        }
    });
});
