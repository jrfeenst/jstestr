
define([
    "jstestr/assert",
    "jstestr/queue",
    "jstestr/test"
], function (assert, queue, test) {
    
    test.defineSuite("Queue", {
        "Default Args": function () {
            var q = new queue();
            assert.isTrue(q.timeout > 0, "Default timeout");
            assert.isTrue(q.document === document, "Default document");
            assert.isEqual(0, q._currentTask, "Current task should be 0");
            assert.isEqual(0, q._insertionPoint, "Insertion point should be 0");
        },
        
        "Constructor Args": function () {
            var fakeDoc = {};
            var q = new queue({timeout: 100, document: fakeDoc});
            assert.isEqual(100, q.timeout, "Custom timeout");
            assert.isEqual(fakeDoc, q.document, "Custom document");
        },
        
        "Basic Queue Functionality": function () {
            var q = new queue();
            
            var ran1 = false, ran2 = false, order = 0;
            q.then(function () {
                ran1 = true;
                order = 1;
                q.next();
            });
            
            q.then(function () {
                ran2 = true;
                order = 2;
                q.next();
            });
            
            assert.isEqual(2, q._queue.length, "Queue length");
            assert.isEqual(0, q._currentTask, "Current task should be 0");
            assert.isEqual(2, q._insertionPoint, "Insertion point should be 2");
            
            var future = q.start();
            
            assert.isTrue(ran1, "First function should run");
            assert.isTrue(ran2, "Second function should run");
            assert.isEqual(2, order, "Last function is the second");
            assert.isEqual(2, q._currentTask, "Current task should be 2");
            assert.isEqual(2, q._insertionPoint, "Insertion point should still be 2");
            
            var success = false, failure = false, error;
            future.then(function () {
                success = true;
            }, function (e) {
                failure = true;
                error = e;
            });
            assert.isTrue(success, "Queue should finish successfully");
            assert.isFalse(failure, "Queue should not fail");
            assert.isFalse(error, "Error should not be received");
        },
        
        "Error Handling": function () {
            var q = new queue();
            
            var ran = false;
            q.then(function () {
                ran = true;
                throw new Error("Should throw");
            });
            
            var future = q.start();
            
            assert.isTrue(ran, "Function should run");
            
            var success = false, failure = false, error;
            future.then(function () {
                success = true;
            }, function (e) {
                failure = true;
                error = e;
            });
            assert.isFalse(success, "Queue should not finish successfully");
            assert.isTrue(failure, "Queue should fail");
            assert.isTrue(error, "Error should be received");
        }
    });
});
