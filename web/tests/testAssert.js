
define([
    "jstestr/assert",
    "jstestr/test"
], function (assert, test) {
    
    test.defineSuite("Assert", {
        "Assert True": function () {
            assert.assertTrue(true, "Boolean true");
            assert.assertTrue({}, "Objects are truthy");
            assert.assertTrue("String", "Non-empty strings are truthy");

            try {
                assert.assertTrue(false, "False is falsey, should throw");
            } catch (error1) {
                assert.assertTrue(error1, "Error should be truthy: false");
            }

            try {
                assert.assertTrue(null, "null is falsey, should throw");
            } catch (error2) {
                assert.assertTrue(error2, "Error should be truthy: null");
            }
            
            try {
                assert.assertTrue(undefined, "Undefined is falsey, should throw");
            } catch (error3) {
                assert.assertTrue(error3, "Error should be truthy: undefined");
            }
            
            try {
                assert.assertTrue("", "Empty string is falsey, should throw");
            } catch (error4) {
                assert.assertTrue(error4, "Error should be truthy: ''");
            }
        },
        
        "Assert False": function () {
            assert.assertFalse(false, "Boolean false");
            assert.assertFalse(null, "null is falsey");
            assert.assertFalse(undefined, "undefined is falsey");
            assert.assertFalse("", "Empty string is falsey");
            
            try {
                assert.assertFalse(true, "True is truthy, should throw");
            } catch (error1) {
                assert.assertTrue(error1, "Error should be truthy: true");
            }
            
            try {
                assert.assertFalse({}, "object is truthy, should throw");
            } catch (error2) {
                assert.assertTrue(error2, "Error should be truthy: {}");
            }
            
            try {
                assert.assertFalse("String", "String is falsey, should throw");
            } catch (error3) {
                assert.assertTrue(error3, "Error should be truthy: undefined");
            }
        },
        
        "Assert Equals": function () {
            assert.assertEquals(1, 1, "Numeric equality");
            assert.assertEquals("A String 123", "A String 123", "String equality");
            assert.assertEquals({prop1: "prop1"}, {prop1: "prop1"}, "Object equality");
            
            try {
                assert.assertEquals(1, 2, "1 != 2");
            } catch (error1) {
                assert.assertTrue(error1, "Error should be truthy: numeric");
            }
            
            try {
                assert.assertEquals("1", "2", "'1' != '2'");
            } catch (error2) {
                assert.assertTrue(error2, "Error should be truthy: string");
            }

            try {
                assert.assertEquals({prop1: "1"}, {prop1: "1", prop2: "extra"}, "Extra props");
            } catch (error3) {
                assert.assertTrue(error3, "Error should be truthy: extra props");
            }
            
            try {
                assert.assertEquals({prop1: "1"}, {prop1: "2"}, "Prop values");
            } catch (error4) {
                assert.assertTrue(error4, "Error should be truthy: prop values");
            }
            
            try {
                assert.assertEquals({prop1: "1"}, {prop2: "1"}, "Different keys");
            } catch (error5) {
                assert.assertTrue(error5, "Error should be truthy: keys");
            }
        },
        
        "Assert Throws": function () {
            var NewError = function NewError() {};
            assert.assertThrows(Error, function () { throw new Error(); }, "Thrown error");
            assert.assertThrows(NewError, function () { throw new NewError(); }, "Throw custom error");
            
            try {
                assert.assertThrows(NewError, function () { throw new Error(); }, "Type missmatch");
            } catch (error) {
                assert.assertTrue(error, "Error should be truthy: type");
            }
        }
    });
});