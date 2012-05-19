
define([
    "jstestr/assert",
    "jstestr/Event",
    "jstestr/test"
], function (assert, Event, test) {
    var e = new Event();
    
    test.defineSuite("Event", {
        "Defaults": function () {
            assert.isTrue(e.defaultActions, "Has default actions");
            assert.isTrue(e.eventDefaults, "Has event defaults");
        },
        
        "Create And Dispatch Event": function () {
            var testNode = test.getNewTestNode();
            
            var customEvent = e._createEvent("custom", testNode);
            
            var mock = assert.createMockFunction();
            e.on("custom", testNode, mock);
            
            e._dispatchEvent(customEvent, testNode);
            
            mock.verify("Event listener should be called");
        },
        
        "Event With Default Action": function () {
            var testNode = test.getNewTestNode();
            
            var customEvent = e._createEvent("custom", testNode);
            
            var mock = assert.createMockFunction();
            e.defaultActions.custom = mock;
            e._dispatchEvent(customEvent, testNode);
            
            mock.verify("Event listener should be called");
        },
        
        "Prevent Default Action": function () {
            var testNode = test.getNewTestNode();
            
            var customEvent = e._createEvent("custom", testNode);
            
            e.on("custom", testNode, function (ev) {
                ev.preventDefault();
            });
            
            var mock = assert.createMockFunction();
            mock.times(0);
            e.defaultActions.custom = mock;
            e._dispatchEvent(customEvent, testNode);
            
            mock.verify("Event listener should not be called");
        }
    });
});
