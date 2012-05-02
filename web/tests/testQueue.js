
define([
    "jstestr/assert",
    "jstestr/queue",
    "jstestr/test"
], function (assert, queue, test) {
    
    test.defineSuite("Queue", {
        "Default Args": function () {
            var q = new queue();
            assert.assertTrue(q.timeout > 0, "Default timeout");
            assert.assertTrue(q.document === document, "Default document");
            assert.assertEquals(0, q._currentTask, "Current task should be 0");
            assert.assertEquals(0, q._insertionPoint, "Insertion point should be 0");
        },
        
        "Constructor Args": function () {
            var fakeDoc = {};
            var q = new queue({timeout: 100, document: fakeDoc});
            assert.assertEquals(100, q.timeout, "Custom timeout");
            assert.assertEquals(fakeDoc, q.document, "Custom document");
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
            
            assert.assertEquals(2, q._queue.length, "Queue length");
            assert.assertEquals(0, q._currentTask, "Current task should be 0");
            assert.assertEquals(2, q._insertionPoint, "Insertion point should be 2");
            
            var future = q.start();
            
            assert.assertTrue(ran1, "First function should run");
            assert.assertTrue(ran2, "Second function should run");
            assert.assertEquals(2, order, "Last function is the second");
            assert.assertEquals(2, q._currentTask, "Current task should be 2");
            assert.assertEquals(2, q._insertionPoint, "Insertion point should still be 2");
            
            var success = false, failure = false, error;
            future.then(function () {
                success = true;
            }, function (e) {
                failure = true;
                error = e;
            });
            assert.assertTrue(success, "Queue should finish successfully");
            assert.assertFalse(failure, "Queue should not fail");
            assert.assertFalse(error, "Error should not be received");
        },
        
        "Error Handling": function () {
            var q = new queue();
            
            var ran = false;
            q.then(function () {
                ran = true;
                throw new Error("Should throw");
            });
            
            var future = q.start();
            
            assert.assertTrue(ran, "Function should run");
            
            var success = false, failure = false, error;
            future.then(function () {
                success = true;
            }, function (e) {
                failure = true;
                error = e;
            });
            assert.assertFalse(success, "Queue should not finish successfully");
            assert.assertTrue(failure, "Queue should fail");
            assert.assertTrue(error, "Error should be received");
        }
    });
});
