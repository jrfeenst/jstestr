
define([
    "require",
    "jstestr/test",
    "jstestr/assert"
], function (require, test, assert) {
    
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
            
            assert.isEqual({
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
                    assert.isTrue(false, "Should fail");
                }
            });
            framework.runSync = true; // useful for testing the tests
            framework.runAll();
            
            assert.isTrue(ran, "First test should run");
            assert.isTrue(
                framework.suites["fake suite"]["fake test 1c"].success, "First test should succeed");
            assert.isFalse(
                framework.suites["fake suite"]["fake test 2c"].success, "Second test should fail");
        },
        
        "Before and After Functions": function () {
            var ran = false;
            var framework = new test.Framework();
            
            var mock = assert.createMockObject([
                "beforeSuite",
                "afterSuite",
                "beforeEach",
                "afterEach",
                "test 1",
                "test 2"
            ]);
            
            // delete the special methods because they would be treated as test methods otherwise
            var verify = mock.verify;
            delete mock.verify;
            delete mock.reset;
            
            mock.beforeEach.times(2);
            mock.afterEach.times(2);
            
            framework.defineSuite("fake suite", mock);
            
            framework.runSync = true; // useful for testing the tests
            framework.runAll();
            
            verify("Test methods should be called properly");
        },
        
        "Async Test": function () {
            var framework = new test.Framework();
            framework.defineSuite("fake suite", {
                "fake test 1d": function () {
                    assert.isFalse(test.suites["Testing Framework"]["Async Test"].success,
                        "Should not be successful yet, it is still running");
                    
                    console.log("Ran test 1d. This should be nested properly and before the success message.");
                }
            });
            
            return framework.runAll();
        },
        
        "Test Get New Node": function () {
            var framework = new test.Framework();
            var testNode = test.getNewTestNode();
            assert.isTrue(testNode, "DOM node ");
            
            framework.setTestNodeParent(testNode);
            var node = framework.getNewTestNode();
            assert.isEqual(testNode, node.parentNode, "Node is child of test node");
        },
        
        "Test With Console Output": function () {
            console.log("This is a log statement. This test needs to be manually verified.");
            console.info("This info output should be indented one more level than the test start.");
            console.error("This error line should also be indented");
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
                assert.isTrue(ran, "First test should run");
                assert.isFalse(framework.suites["fake suite"]["fake test 1d"].success, "Test should fail");
            }));
        }
    });
    
    test.defineSuite("Page Under Test", {
        "pageUnderTest": require.toUrl("./pageUnderTest.html"),
        
        "Page Load": function () {
            assert.isTrue(this.document, "Document should be set");
            assert.isTrue(this.global, "Global should be set");
            
            assert.isNotEqual(this.global.location.href, location.href, "Locations should be different");
        }
    });
});

