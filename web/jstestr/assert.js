
define([], function () {
    var function_pattern = /function\s*( [\w\-$]+)?\s*\(/i;
    
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
        
    function assertTrue(expression, help) {
        if (!expression) {
            throw createError("Expression is not true: '" + expression + "'.", help);
        }
    }
    
    function assertFalse(expression, help) {
        if (expression) {
            throw createError("Expression is not false: '" + expression + "'.", help);
        }
    }
    
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
    
    function assertEquals(expected, actual, help) {
        if (!_isEqual(expected, actual)) {
            throw createError("Expected '" + expected + "', but found: '" + actual + "'.", help);
        }
    }
    
    function assertThrows(expected, func, help) {
        try {
            func();
            throw createError("Did not receive any exception. Expected: '" + expected + "'.", help);
        } catch (actual) {
            if (!(actual instanceof expected)) {
                throw createError("Expected exception: '" + expected +
                    "', but received: '" + actual + "'.", help);
            }
        }
    }
    
    return {
        assertTrue: assertTrue,
        assertFalse: assertFalse,
        assertEquals: assertEquals,
        assertThrows: assertThrows
    };
});
