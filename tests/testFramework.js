
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
        
        "Async Test With Error": function () {
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
            framework.runAll().then(function () {
                assert.isTrue(ran, "First test should run");
                assert.isFalse(framework.suites["fake suite"]["fake test 1d"].success, "Test should fail");
            });
        },
        
        "Ignored Test": function () {
            var ran = false;
            var framework = new test.Framework();
            framework.defineSuite("fake suite", {
                "//ignored fake test": function () {
                    ran = true;
                }
            });
            framework.runSync = true; // useful for testing the tests
            framework.runAll().then(function () {
                assert.isFalse(ran, "First test should not run");
                assert.isTrue(framework.suites["fake suite"]["//ignored fake test"].ignored, "Test should be ignored");
            });
        },
        
        "Conditionally Ignored Test": function () {
            var ran1 = ran2 = ran3 = false;
            var framework = new test.Framework();
            framework.defineSuite("fake suite", {
                "//{fake1}ignored fake test": function () {
                    ran1 = true;
                },

                "//{fake2}ignored fake test 2": function () {
                    ran2 = true;
                },

                "//{!fake1}ignored fake test 3": function () {
                    ran3 = true;
                }
            });

            framework.conditions.fake1 = true;
            framework.conditions.fake2 = false;

            framework.runSync = true; // useful for testing the tests
            framework.runAll().then(function () {
                assert.isFalse(ran1, "First test should not run");
                assert.isTrue(ran2, "Second test should run");
                assert.isTrue(ran3, "Third test should run");
                assert.isTrue(framework.suites["fake suite"]["//{fake1}ignored fake test"].ignored, "Test should be ignored");
                assert.isTrue(framework.suites["fake suite"]["//{fake2}ignored fake test 2"].success, "Test should pass");
                assert.isFalse(framework.suites["fake suite"]["//{fake2}ignored fake test 2"].ignored, "Test should not be ignored");
            });
        },
        
        "Ignored Suite": function () {
            var ran = false;
            var framework = new test.Framework();
            framework.defineSuite("//fake suite", {
                "fake test": function () {
                    ran = true;
                }
            });

            framework.runSync = true; // useful for testing the tests
            framework.runAll().then(function () {
                assert.isFalse(ran, "Test should not run");
                assert.isTrue(framework.suites["//fake suite"]["fake test"].ignored, "Test should be ignored");
            });
        },

        "Basic Generative Test": function () {
            var params = [];
            var framework = new test.Framework();
            framework.defineSuite("fake suite", {
                "Test $name": {
                    parameters: {
                        name: ["A", "B"],
                        param1: ["one", "three"],
                        param2: ["two", "four"],
                        expected: [123, 456]
                    },

                    test: function (param1, param2, expected) {
                        params.push(Array.prototype.slice.call(arguments, 0));
                    }
                }
            });

            framework.runSync = true; // useful for testing the tests
            framework.runAll().then(function () {
                params.sort();
                assert.matches([["one", "two", 123, assert.any()], ["three", "four", 456, assert.any]], params, "Test parameters");
            });
        },

        "Mock Timeout": function () {
            test.mockTime();
            
            var mock = assert.createMockFunction().times(0);
            setTimeout(mock, 0);

            mock.verify("Not called yet");

            mock.times(1);

            // flow time multiple times
            test.tick(10);
            test.tick(10);
            test.tick(10);

            mock.verify("Now is called once");
        },

        "Mock Clear Timeout": function () {
            test.mockTime();
            
            var mock = assert.createMockFunction().times(0);
            var id = setTimeout(mock, 0);

            mock.verify("Not called yet");

            clearTimeout(id);

            // flow time multiple times
            test.tick(10);
            test.tick(10);
            test.tick(10);

            mock.verify("Still not called");
        },

        "Mock Interval": function () {
            test.mockTime();
            
            var mock = assert.createMockFunction().times(0);
            setInterval(mock, 10);

            mock.verify("Not called yet");

            mock.times(1);
            test.tick(15);
            mock.verify("now is called once");

            mock.times(2);
            test.tick(10);
            mock.verify("called again");
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

