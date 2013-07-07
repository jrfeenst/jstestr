
define([
    "jstestr/assert",
    "jstestr/test"
], function (assert, test) {
    
    var obj = {};
    var func = function () {};
    var array = [];
    var num = 1;
    var str = "string";
    
    
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
        
        "Assert Same": function () {
            var a = {a: 1};
            var b = {a: 1};
            var c = {a: 2};
            assert.isSame(a, a, "A is the same as itself");
            assert.isSame(b, b, "B is the same as itself");
            
            try {
                assert.isSame(a, b, "A should not be the same as B");
            } catch (error1) {
                assert.isTrue(error1, "Error should be truthy: A B");
            }
            
            try {
                assert.isSame(a, c, "A should not be the same as C");
            } catch (error2) {
                assert.isTrue(error2, "Error should be truthy: A C");
            }
        },
        
        "Assert Not Same": function () {
            var a = {a: 1};
            var b = {a: 1};
            var c = {a: 2};
            assert.isNotSame(a, b, "A is not the same as B");
            assert.isNotSame(a, c, "A is not the same as B");
            
            try {
                assert.isNotSame(a, a, "A should be the same as itself");
            } catch (error1) {
                assert.isTrue(error1, "Error should be truthy: A A");
            }
            
            try {
                assert.isNotSame(c, c, "C should not be the same as C");
            } catch (error2) {
                assert.isTrue(error2, "Error should be truthy: C C");
            }
        },
        
        "Assert Close": function () {
            assert.isClose(1, 1, .001, "1 is 1");
            assert.isClose(-100000, -100000, "-100000 is -100000");
            assert.isClose(1, 2, 1, "1 is close to 2 with tolerance");
            assert.isClose(1, 1.05, .1, "1 is 1.05 with tolerance");
            
            try {
                assert.isClose(1, 2, "1 is not close to 2 without tolerance");
            } catch (error1) {
                assert.isTrue(error1, "Error should be truthy: 1 != 2");
            }
        },
        
        "Assert Matches": function () {
            var a = {a: 1, b: {c: "c"}, d: /d/};
            var b = "this is b";
            assert.matches({a: 1}, a, "field a exists");
            assert.matches({b: {}}, a, "field b exists");
            assert.matches({b: {c: /c/}}, a, "field c regexp");
            assert.matches({d: /d/}, a, "field d regexp");

            assert.matches(/is b/, b, "regexp matches");

            try {
                assert.matches({e: "no field"}, a, "not a field");
            } catch (error1) {
                assert.isTrue(error1, "Error should be truthy: a no field e");
            }

            try {
                assert.matches(/no match/, b, "regexp no match");
            } catch (error2) {
                assert.isTrue(error2, "Error should be truthy: no regexp match");
            }
        },
        
        "Assert Matches Any": function () {
            var a = {a: 1, b: {c: "c"}, d: /d/, e: [1, 2]};
            var b = "this is b";
            assert.matches(assert.any(), a, "a is anything");
            assert.matches({a: assert.any()}, a, "field a is anything");
            assert.matches(assert.any, b, "b is anything");
            assert.matches({a: 1, e: [1, assert.any]}, a, "any in an array");

            try {
                assert.matches({e: assert.any}, a, "not a field");
            } catch (error1) {
                assert.isTrue(error1, "Error should be truthy: a no field e");
            }
        },
        
        "Assert Matches Range": function () {
            assert.matches({a: assert.range(0, 2)}, {a: 1}, "a is in range");
            assert.matches(assert.range(1, 3), 1, "1 is in range");
            assert.matches([assert.range(1, 3), 1], [3, 1], "array value in range");

            try {
                assert.matches({e: assert.range(0, 2)}, {e: -1}, "field e is out of range");
            } catch (error1) {
                assert.isTrue(error1, "Error should be truthy: field is out of range");
            }

            try {
                assert.matches(assert.range(-2, -1), 0, "0 is out of range");
            } catch (error1) {
                assert.isTrue(error1, "Error should be truthy: 0 is out of range");
            }
        },
        
        "Assert Object": function () {
            assert.isObject(obj, "obj should be an object");
            
            try {
                assert.isObject(func, "func is not an object");
            } catch (error1) {
                assert.isTrue(error1, "Error should be truthy: func");
            }
            
            try {
                assert.isObject(array, "array is not an object");
            } catch (error2) {
                assert.isTrue(error2, "Error should be truthy: array");
            }
            
            try {
                assert.isObject(num, "num is not an object");
            } catch (error3) {
                assert.isTrue(error3, "Error should be truthy: num");
            }
            
            try {
                assert.isObject(str, "str is not an object");
            } catch (error4) {
                assert.isTrue(error4, "Error should be truthy: str");
            }
        },
        
        "Assert Array": function () {
            assert.isArray(array, "array should be an array");
            
            try {
                assert.isArray(func, "func is not an array");
            } catch (error1) {
                assert.isTrue(error1, "Error should be truthy: func");
            }
            
            try {
                assert.isArray(obj, "obj is not an array");
            } catch (error2) {
                assert.isTrue(error2, "Error should be truthy: obj");
            }
            
            try {
                assert.isArray(num, "num is not an array");
            } catch (error3) {
                assert.isTrue(error3, "Error should be truthy: num");
            }
            
            try {
                assert.isArray(str, "str is not an array");
            } catch (error4) {
                assert.isTrue(error4, "Error should be truthy: str");
            }
        },
        
        "Assert Function": function () {
            assert.isFunction(func, "func should be a function");
            
            try {
                assert.isFunction(obj, "obj is not a function");
            } catch (error1) {
                assert.isTrue(error1, "Error should be truthy: obj");
            }
            
            try {
                assert.isFunction(array, "array is not a function");
            } catch (error2) {
                assert.isTrue(error2, "Error should be truthy: array");
            }
            
            try {
                assert.isFunction(num, "num is not a function");
            } catch (error3) {
                assert.isTrue(error3, "Error should be truthy: num");
            }
            
            try {
                assert.isFunction(str, "str is not a function");
            } catch (error4) {
                assert.isTrue(error4, "Error should be truthy: str");
            }
        },
        
        "Assert Number": function () {
            assert.isNumber(num, "num should be a number");
            
            try {
                assert.isNumber(func, "func is not a number");
            } catch (error1) {
                assert.isTrue(error1, "Error should be truthy: func");
            }
            
            try {
                assert.isNumber(array, "array is not a number");
            } catch (error2) {
                assert.isTrue(error2, "Error should be truthy: array");
            }
            
            try {
                assert.isNumber(obj, "obj is not a number");
            } catch (error3) {
                assert.isTrue(error3, "Error should be truthy: obj");
            }
            
            try {
                assert.isNumber(str, "str is not a number");
            } catch (error4) {
                assert.isTrue(error4, "Error should be truthy: str");
            }
        },
        
        "Assert String": function () {
            assert.isString(str, "str should be a string");
            
            try {
                assert.isString(func, "func is not a string");
            } catch (error1) {
                assert.isTrue(error1, "Error should be truthy: func");
            }
            
            try {
                assert.isString(array, "array is not a string");
            } catch (error2) {
                assert.isTrue(error2, "Error should be truthy: array");
            }
            
            try {
                assert.isString(num, "num is not a string");
            } catch (error3) {
                assert.isTrue(error3, "Error should be truthy: num");
            }
            
            try {
                assert.isString(obj, "obj is not a string");
            } catch (error4) {
                assert.isTrue(error4, "Error should be truthy: obj");
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