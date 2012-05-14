
define([
    "jstestr/assert",
    "jstestr/test"
], function (assert, test) {
    
    test.defineSuite("Assert", {
        "Assert True": function () {
            assert.isTrue(true, "Boolean true");
            assert.isTrue({}, "Objects are truthy");
            assert.isTrue("String", "Non-empty strings are truthy");

            try {
                assert.isTrue(false, "False is falsey, should throw");
            } catch (error1) {
                assert.isTrue(error1, "Error should be truthy: false");
            }

            try {
                assert.isTrue(null, "null is falsey, should throw");
            } catch (error2) {
                assert.isTrue(error2, "Error should be truthy: null");
            }
            
            try {
                assert.isTrue(undefined, "Undefined is falsey, should throw");
            } catch (error3) {
                assert.isTrue(error3, "Error should be truthy: undefined");
            }
            
            try {
                assert.isTrue("", "Empty string is falsey, should throw");
            } catch (error4) {
                assert.isTrue(error4, "Error should be truthy: ''");
            }
        },
        
        "Assert False": function () {
            assert.isFalse(false, "Boolean false");
            assert.isFalse(null, "null is falsey");
            assert.isFalse(undefined, "undefined is falsey");
            assert.isFalse("", "Empty string is falsey");
            
            try {
                assert.isFalse(true, "True is truthy, should throw");
            } catch (error1) {
                assert.isTrue(error1, "Error should be truthy: true");
            }
            
            try {
                assert.isFalse({}, "object is truthy, should throw");
            } catch (error2) {
                assert.isTrue(error2, "Error should be truthy: {}");
            }
            
            try {
                assert.isFalse("String", "String is falsey, should throw");
            } catch (error3) {
                assert.isTrue(error3, "Error should be truthy: undefined");
            }
        },
        
        "Assert Equals": function () {
            assert.isEqual(1, 1, "Numeric equality");
            assert.isEqual("A String 123", "A String 123", "String equality");
            assert.isEqual({prop1: "prop1"}, {prop1: "prop1"}, "Object equality");
            
            try {
                assert.isEqual(1, 2, "1 != 2");
            } catch (error1) {
                assert.isTrue(error1, "Error should be truthy: numeric");
            }
            
            try {
                assert.isEqual("1", "2", "'1' != '2'");
            } catch (error2) {
                assert.isTrue(error2, "Error should be truthy: string");
            }

            try {
                assert.isEqual({prop1: "1"}, {prop1: "1", prop2: "extra"}, "Extra props");
            } catch (error3) {
                assert.isTrue(error3, "Error should be truthy: extra props");
            }
            
            try {
                assert.isEqual({prop1: "1"}, {prop1: "2"}, "Prop values");
            } catch (error4) {
                assert.isTrue(error4, "Error should be truthy: prop values");
            }
            
            try {
                assert.isEqual({prop1: "1"}, {prop2: "1"}, "Different keys");
            } catch (error5) {
                assert.isTrue(error5, "Error should be truthy: keys");
            }
        },
        
        "Assert Throws": function () {
            var NewError = function NewError() {};
            assert.doesThrow(Error, function () {throw new Error();}, "Thrown error");
            assert.doesThrow(NewError, function () {throw new NewError();}, "Throw custom error");
            
            try {
                assert.doesThrow(NewError, function () {throw new Error();}, "Type missmatch");
            } catch (error) {
                assert.isTrue(error, "Error should be truthy: type");
            }
        },
        
        "Mock Function Number of Calls": function () {
            var mock = assert.createMockFunction();
            
            assert.doesThrow(Error, mock.verify, "Verify mock with no calls");
            
            mock();
            mock.verify("Should be called once with no arg verification");
            
            mock(1, 2, 3);
            
            assert.doesThrow(Error, mock.verify, "Verify mock with too many calls");
            
            mock.times(2);
            mock.verify("Should be called twice with no arg verification");
        },
        
        "Mock Function Args and Result": function () {
            var mock = assert.createMockFunction();
            mock.expect(1, "two", {three: true}).result(4);
            
            var result = mock(1, "two", {three: true});
            mock.verify("Should verify args");
            
            assert.isEqual(4, result, "Mock should return 4");
            
            mock.reset();
            mock();
            
            assert.doesThrow(Error, mock.verify, "Verify mock with bad args");
        },
        
        "Mock Function Throws": function () {
            var mock = assert.createMockFunction();
            mock.error(new Error("Fake error"));
            assert.doesThrow(Error, mock, "Should throw");
            mock.verify("Should be called");
        },
        
        "Mock Object Methods": function () {
            // mock from an array of method names
            var mock = assert.createMockObject(["method1", "method2"]);
            assert.isTrue(mock.method1, "Mock should have method1");
            assert.isTrue(mock.method2, "Mock should have method2");
            
            var Constructor = function () {};
            Constructor.prototype.method1 = function () {};
            Constructor.prototype.method2 = function () {};
            Constructor.prototype.prop1 = true;
            
            // mock from a constructor function
            mock = assert.createMockObject(Constructor);
            
            assert.isTrue(mock.method1, "Mock should have method1");
            assert.isTrue(mock.method2, "Mock should have method2");
            assert.isFalse(mock.prop1, "Properties should be ignored");
            
            // mock from an object (just happens to be a prototype in this case)
            mock = assert.createMockObject(Constructor.prototype);
            
            assert.isTrue(mock.method1, "Mock should have method1");
            assert.isTrue(mock.method2, "Mock should have method2");
            assert.isFalse(mock.prop1, "Properties should be ignored");
        },
        
        "Mock Object Verify and Reset": function () {
            // mock from an array of method names
            var mock = assert.createMockObject(["method1", "method2"]);
            
            mock.method1.expect(true).times(2);
            mock.method2.times(0);
            
            mock.method1(true);
            mock.method1(true);
            
            mock.verify("Mock method1 should be called twice");
            
            mock.method2();
            
            assert.doesThrow(Error, mock.verify, "Method 2 should cause failure to verify");
            
            mock.reset();
            mock.method1(true);
            mock.method1(true);
            
            mock.verify("Reset should reset actual method calls but not expectations");
        }
    });
});