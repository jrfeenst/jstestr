
define([], function () {
    var FUNCTION_PATTERN = /function\s*( [\w\-$]+)?\s*\(/i;
    
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
        } else if (obj instanceof Function) {
            return obj.toString();
        } else if (obj instanceof Array) {
            return "[" + obj.map(toString).join(",") + "]";
        } else {
            var str;
            try {
                str = JSON.stringify(obj);
            } catch (e) {
                str = obj.toString();
            }
            if (str.length > 50) {
                str = "\n    " + str + "\n";
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
                fn = FUNCTION_PATTERN.test(curr.toString()) ? RegExp.$1 || "anonymous" : "anonymous";
                error.stack += fn + "\n";
                curr = curr.caller;
            }
        }
        return error;
    }
    
    /**
     * Assert that an expression is truthy.
     */
    function isTrue(expression, help) {
        if (!expression) {
            throw createError("Expression is not true " + toString(expression) + ".", help);
        }
    }
    
    /**
     * Assert that an expression is falsey.
     */
    function isFalse(expression, help) {
        if (expression) {
            throw createError("Expression is not false " + toString(expression) + ".", help);
        }
    }
    
    
    function _isEqual(expected, actual, seenObjs) {
        seenObjs = seenObjs || [];
        var i;
        // check to see if we've already seen this pair of objects and stop recursing if we did
        for (i = 0; i < seenObjs.length; i++) {
            if (seenObjs[i][0] === expected && seenObjs[i][1] === actual) {
                return true;
            }
        }
        seenObjs.push([expected, actual]);

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
            expectedKeys.sort();
            actualKeys.sort();
            for (i = 0; i < expectedKeys.length; i++) {
                key = expectedKeys[i];
                if (key !== actualKeys[i] || !_isEqual(expected[key], actual[key], seenObjs)) {
                    return false;
                }
            }
            return true;
        }
        // all other data types are simple coerced equality
        return expected == actual;
    }
    
    /**
     * Assert that two objects are deeply equal.
     */
    function isEqual(expected, actual, help) {
        if (!_isEqual(expected, actual)) {
            throw createError("Expected " + toString(expected) + " but found " +
                toString(actual) + ".", help);
        }
    }
    
    /**
     * Assert that two objects are not deeply equal.
     */
    function isNotEqual(expected, actual, help) {
        if (_isEqual(expected, actual)) {
            throw createError("Expected " + toString(expected) + " to be different from " +
                toString(actual) + ".", help);
        }
    }

    /**
     * Assert that two numbers are close with the specified tolerance.
     */
    function isClose(expected, actual, toleranceOrHelp, help) {
        if (typeof toleranceOrHelp === "string") {
            help = toleranceOrHelp;
        }
        tolerance = typeof toleranceOrHelp === "number" ? toleranceOrHelp : 0.0001;
        if (typeof actual !== "number" || Math.abs(actual - expected) > tolerance) {
            throw createError("Expected a number close to " + toString(expected) +
                " but found " + toString(actual) + ".", help);
        }
    }


    function Any() {
    }

    /**
     * Used to represent any value when matching.
     */
    function any() {
        return new Any();
    }

    any.toString = Any.prototype.toString = function () {
        return "any";
    };

    /**
     * Used to represent a range of numbers when matching.
     */
    function Range(start, end) {
        this.start = start;
        this.end = end;
    }
    
    Range.prototype.toString = function toString() {
        return this.start + ":" + this.end;
    };

    function range(start, end) {
        return new Range(start, end);
    }


    /**
     * Assert that an object has the expected fields and values or matches the expected regular expression.
     */
    function matches(expected, actual, help) {
        if (!_matches(expected, actual)) {
            throw createError("Expected " + toString(expected) + " to match " + 
                toString(actual) + ".", help);
        }
    }

    function _matches(expected, actual) {
        if ((expected instanceof Any || expected === any) && actual !== undefined) {
            return true;

        } else if (expected instanceof Range) {
            return expected.start <= actual &&  actual <= expected.end;

        } else if (expected instanceof Array) {
            return expected.every(function (exp, i) {
                return _matches(exp, actual[i]);
            });

        } else if (expected instanceof RegExp) {
            return expected.test(actual);

        } else if (typeof expected === "object") {
            return Object.keys(expected).every(function (key) {
                return _matches(expected[key], actual[key]);
            });

        } else {
            return _isEqual(expected, actual);
        }
    }
    
    /**
     * Assert that two objects are the same (strict ===).
     */
    function isSame(expected, actual, help) {
        if (expected !== actual) {
            throw createError("Expected " + toString(expected) + " but found " +
                toString(actual) + ".", help);
        }
    }
    
    /**
     * Assert that two objects are the same (strict !==).
     */
    function isNotSame(expected, actual, help) {
        if (expected === actual) {
            throw createError("Expected " + toString(expected) + " to be different from " +
                toString(actual) + ".", help);
        }
    }
    
    /**
     * Assert that value is of type object.
     */
    function isObject(obj, help) {
        if (typeof obj !== "object" || obj.constructor === Array) {
            throw createError("Expected an object, by found " + toString(obj) + ".", help);
        }
    }
    
    /**
     * Assert that value is of type function.
     */
    function isFunction(obj, help) {
        if (typeof obj !== "function") {
            throw createError("Expected a function, by found " + toString(obj) + ".", help);
        }
    }
    
    /**
     * Assert that value is of type array.
     */
    function isArray(obj, help) {
        if (obj.constructor !== Array && !(!obj.constructor && obj.forEach)) {
            throw createError("Expected an array, by found: '" + toString(obj) + "'.", help);
        }
    }
    
    /**
     * Assert that value is of type number.
     */
    function isNumber(obj, help) {
        if (typeof obj !== "number") {
            throw createError("Expected a number, by found: '" + toString(obj) + "'.", help);
        }
    }
    
    /**
     * Assert that value is of type string.
     */
    function isString(obj, help) {
        if (typeof obj !== "string") {
            throw createError("Expected a string, by found: '" + toString(obj) + "'.", help);
        }
    }
    
    /**
     * Assert that function throws the expected error (instanceof check).
     */
    function doesThrow(expected, func, help) {
        try {
            func();
            throw createError("Did not receive any exception. Expected " + toString(expected) + ".", help);
        } catch (actual) {
            if (!(actual instanceof expected)) {
                throw createError("Expected exception " + toString(expected) +
                    ", but received " + toString(actual) + ".", help);
            }
        }
    }
    
    /**
     * Construct a mock function which can be used to expect certain args and return certain values.
     */
    function createMockFunction() {
        var mock = function () {
            mock._actualArgs.push(Array.prototype.slice.call(arguments));
            if (mock._error !== undefined) {
                throw mock._error;
            }
            if (mock._delegate) {
                return mock._delegate.apply(this, arguments);
            } else {
                return mock._result;
            }
        };

        mock._expectedArgs;
        mock._actualArgs = [];
        mock._expectedCalls = 1;
        mock._error;
        mock._result;

        mock.expect = function mockExpect() {
            mock._expectedArgs = Array.prototype.slice.call(arguments);
            return mock;
        };
        mock.error = function mockError(err) {
            mock._error = err;
            return mock;
        };
        mock.result = function mockResult(obj) {
            mock._result = obj;
            return mock;
        };
        mock.times = function mockTimes(num) {
            mock._expectedCalls = num;
            return mock;
        };
        mock.delegate = function mockDelegate(fn) {
            mock._delegate = fn;
            return mock;
        };
        
        mock.verify = function mockVerify(help) {
            help = help || "";
            isEqual(mock._expectedCalls, mock._actualArgs.length, "Number of calls. " + help);
            if (mock._expectedArgs) {
                for (var i in mock._actualArgs) {
                    isEqual(mock._expectedArgs, mock._actualArgs[i], "Argument missmatch. " + help);
                }
            }
            return mock;
        };
        
        mock.reset = function () {
            mock._actualArgs = [];
            return mock;
        };
        
        return mock;
    }
    
    /**
     * Create a set of mock functions in an object.
     */
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

    /**
     * Create a mock which spies on a method
     */
    function createSpy(obj, method) {
        var mock = createMockFunction(obj);
        if (typeof method === "string") {
            mock.delegate(obj[method].bind(obj));
            obj[method] = mock;
        } else {
            mock.delegate(method.bind(obj));
            for (var key in obj) {
                if (obj[key] === method) {
                    obj[key] = mock;
                }
            }
        }
        return mock;
    }
    
    
    return {
        isTrue: isTrue,
        isFalse: isFalse,
        isEqual: isEqual,
        isNotEqual: isNotEqual,
        isSame: isSame,
        isNotSame: isNotSame,
        isClose: isClose,
        isObject: isObject,
        isArray: isArray,
        isFunction: isFunction,
        isNumber: isNumber,
        isString: isString,
        doesThrow: doesThrow,
        
        matches: matches,
        any: any,
        range: range,

        createMockFunction: createMockFunction,
        createMockObject: createMockObject,
        createSpy: createSpy
    };
});
