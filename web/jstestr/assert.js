
define([], function () {
    var function_pattern = /function\s*( [\w\-$]+)?\s*\(/i;
    
    function toString(obj) {
        if (obj instanceof Node) {
            var pieces = ["<" + obj.type];
            if (obj.id) {
                pieces.push('id="' + obj.id + '"');
            } else if (obj.className) {
                pieces.push('class="' + obj.className + '"');
            }
            pieces.push("/>");
            return pieces.join(" ");
        } else if (obj === undefined || obj === null) {
            return String(obj);
        } else {
            var str = obj.toString();
            if (str.length > 50) {
                str = "\n    '" + str + "'\n";
            } else {
                str = "'" + str + "'";
            }
            return str;
        }
    }
    
    function createError(message, help) {
        help = help || "";
        var error = new Error(message + " " + help);
        if (!error.stack && !error.stacktrace) {
            error.stack = "";
            var fn;
            var curr = arguments.callee.caller;
            var i = 0;
            while (curr && i++ < 20) {
                fn = function_pattern.test(curr.toString()) ? RegExp.$1 || "anonymous" : "anonymous";
                error.stack += fn + "\n";
                curr = curr.caller;
            }
        }
        return error;
    }
        
    function isTrue(expression, help) {
        if (!expression) {
            throw createError("Expression is not true: " + toString(expression) + ".", help);
        }
    }
    
    function isFalse(expression, help) {
        if (expression) {
            throw createError("Expression is not false: " + toString(expression) + ".", help);
        }
    }
    
    
    // todo: handle cycles in the objects
    // recursive deep equality test
    function _isEqual(expected, actual) {
        if (expected === actual) {
            // short circuit for strict equality
            return true;
        }
        if (typeof expected !== typeof actual) {
            // type check
            return false;
        }
        if (typeof expected === "string" || typeof expected === "number") {
            // primative types compared with strict equality
            return expected === actual;
        }
        if (typeof expected === "object") {
            // objects/arrays are checked using property-by-property checking (depth first recursive)
            var key;
            var expectedKeys = [];
            var actualKeys = [];
            for (key in expected) {
                expectedKeys.push(key);
            }
            for (key in actual) {
                actualKeys.push(key);
            }
            if (expectedKeys.length !== actualKeys.length) {
                return false;
            }
            for (var i = 0; i < expectedKeys.length; i++) {
                key = expectedKeys[i];
                if (key !== actualKeys[i] || !_isEqual(expected[key], actual[key])) {
                    return false;
                }
            }
            return true;
        }
        // all other data types are simple coerced equality
        return expected == actual;
    }
    
    function isEqual(expected, actual, help) {
        if (!_isEqual(expected, actual)) {
            throw createError("Expected " + toString(expected) + " but found: " +
                toString(actual) + ".", help);
        }
    }
    
    function isNotEqual(expected, actual, help) {
        if (_isEqual(expected, actual)) {
            throw createError("Expected " + toString(expected) + " to be different from: " +
                toString(actual) + ".", help);
        }
    }
    
    function doesThrow(expected, func, help) {
        try {
            func();
            throw createError("Did not receive any exception. Expected: " + toString(expected) + ".", help);
        } catch (actual) {
            if (!(actual instanceof expected)) {
                throw createError("Expected exception: " + toString(expected) +
                    ", but received: " + toString(actual) + ".", help);
            }
        }
    }
    
    function createMockFunction() {
        var expectedArgs;
        var actualArgs = [];
        var expectedCalls = 1;
        var error;
        var result;
        var mock = function () {
            actualArgs.push(Array.prototype.slice.call(arguments));
            if (error !== undefined) {
                throw error;
            }
            return result;
        };
        mock.expect = function mockExpect() {
            expectedArgs = arguments;
            return mock;
        };
        mock.error = function mockError(err) {
            error = err;
            return mock;
        };
        mock.result = function mockResult(obj) {
            result = obj;
            return mock;
        };
        mock.times = function mockTimes(num) {
            expectedCalls = num;
            return mock;
        };
        
        mock.verify = function mockVerify(help) {
            help = help || "";
            isEqual(expectedCalls, actualArgs.length, "Number of calls. " + help);
            if (expectedArgs) {
                for (var i in actualArgs) {
                    isEqual(expectedArgs, actualArgs[i], "Argument missmatch. " + help);
                }
            }
        };
        
        mock.reset = function () {
            actualArgs = [];
        };
        
        return mock;
    }
    
    
    function createMockObject(methodsOrObj) {
        if (typeof methodsOrObj === "function") {
            methodsOrObj = methodsOrObj.prototype;
        }
        
        var mock = {};
        var mockFunctions = {};
        if (methodsOrObj instanceof Array) {
            methodsOrObj.forEach(function (method) {
                mock[method] = createMockFunction();
                mockFunctions[method] = mock[method];
            });
        } else if (typeof methodsOrObj === "object") {
            for (var method in methodsOrObj) {
                if (typeof methodsOrObj[method] === "function") {
                    mock[method] = createMockFunction();
                    mockFunctions[method] = mock[method];
                }
            }
        }
        
        mock.verify = function mockObjVerify(help) {
            for (var method in mockFunctions) {
                if (mockFunctions.hasOwnProperty(method)) {
                    mockFunctions[method].verify("Method '" + method + "'. " + help);
                }
            }
        };
        
        mock.reset = function mockObjReset() {
            for (var method in mockFunctions) {
                if (mockFunctions.hasOwnProperty(method)) {
                    mockFunctions[method].reset();
                }
            }
        };
        
        return mock;
    }
    
    
    return {
        isTrue: isTrue,
        isFalse: isFalse,
        isEqual: isEqual,
        isNotEqual: isNotEqual,
        doesThrow: doesThrow,
        
        createMockFunction: createMockFunction,
        createMockObject: createMockObject
    };
});
