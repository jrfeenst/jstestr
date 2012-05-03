
define([
    "jstestr/test",
    "jstestr/assert"
], function (test, assert) {
    
    test.defineSuite("Testing Framework", {
        "Define Suite": function () {
            function test1a() {}
            function test2a() {}
            function test1b() {}
            function test2b() {}
            
            var framework = new test.Framework();
            framework.defineSuite("test suite A", {
                "fake test 1a": test1a,
                "fake test 2a": {"test": test2a}
            });
            framework.defineSuite("test suite B", {
                "fake test 1b": test1b,
                "fake test 2b": {"test": test2b}
            });
            framework.defineSuite("empty suite", {});
            
            assert.assertEquals({
                "test suite A": {
                    "fake test 1a": {"test": test1a},
                    "fake test 2a": {"test": test2a}
                },
                "test suite B": {
                    "fake test 1b": {"test": test1b},
                    "fake test 2b": {"test": test2b}
                }
            }, framework.suites, "Suites should be defined")
        },
        
        "Run All": function () {
            var ran = false;
            var framework = new test.Framework();
            framework.defineSuite("fake suite", {
                "fake test 1c": function () {ran = true;},
                "fake test 2c": function () {
                    assert.assertTrue(false, "Should fail");
                }
            });
            framework.runSync = true; // useful for testing the tests
            framework.runAll();
            
            assert.assertTrue(ran, "First test should run");
            assert.assertTrue(
                framework.suites["fake suite"]["fake test 1c"].success, "First test should succeed");
            assert.assertFalse(
                framework.suites["fake suite"]["fake test 2c"].success, "Second test should fail");
        },
        
        "Async Test": function () {
            var framework = new test.Framework();
            framework.defineSuite("fake suite", {
                "fake test 1d": function () {
                    assert.assertFalse(test.suites["Testing Framework"]["Async Test"].success,
                        "Should not be successful yet, it is still running");
                    
                    console.log("Ran test 1d. This should be nested properly and before the success message.");
                }
            });
            
            return framework.runAll();
        },
        
        "Test Get New Node": function () {
            var framework = new test.Framework();
            var testNode = test.getNewTestNode();
            assert.assertTrue(testNode, "DOM node ");
            
            framework.setTestNodeParent(testNode);
            var node = framework.getNewTestNode();
            assert.assertEquals(testNode, node.parentNode, "Node is child of test node");
        },
        
        "Test With Console Output": function () {
            console.log("This test needs to be manually verified.");
            console.log("This is output that should be indented one more level than the test start.");
            console.log("This line should also be indented");
        },
        
        "Async Test With Done": function (done) {
            setTimeout(function doneTestCallback() {
                if (!test.suites["Testing Framework"]["Async Test With Done"].success) {
                    done(true);
                } else {
                    done(false);
                }
            }, 0);
        },
        
        "Async Test With Error": function (done) {
            var ran = false;
            var framework = new test.Framework();
            framework.defineSuite("fake suite", {
                "fake test 1d": function (done) {
                    setTimeout(function () {
                        ran = true;
                        throw new Error();
                    });
                }
            });
            framework.runSync = true; // useful for testing the tests
            framework.runAll().then(done.wrap(function () {
                assert.assertTrue(ran, "First test should run");
                assert.assertFalse(framework.suites["fake suite"]["fake test 1d"].success, "Test should fail");
            }));
        }
    });
});

