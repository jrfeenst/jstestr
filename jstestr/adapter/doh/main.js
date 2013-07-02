
define([
    "jstestr/assert",
    "jstestr/test"
], function (assert, test) {

    var doh = {};

    function convertName(name) {
        name = name.replace(/[\.\-_]/g, " ");
        var nameParts = name.split(/([A-Z][a-z]+|[A-Z]+|[0-9]+)/);
        nameParts = nameParts[0] === "test" ? nameParts.slice(1) : nameParts;
        return nameParts.join(" ").replace(/[ ]+/g, " ");
    }

    doh.register = function (suiteName, tests) {
        var testsObject = {};
        if (tests) {
            tests.forEach(function (test) {
                testsObject[convertName(test.name)] = test;
            });
        }
        test.defineSuite(convertName(suiteName), testsObject);
    };


    doh.Deferred = function () {
        this.callbacks = [];
        this._resolved = false;
        this._failed = false;
    };

    doh.Deferred.prototype.then = function (onSuccess, onFailure) {
        this.callbacks.push({
            onSuccess: onSuccess,
            onFailure: onFailure
        });
        if (this._resolved) {
            if (this._failed) {
                onFailure(this._result);
            } else {
                onSuccess(this._result);
            }
        }
        return this;
    };

    doh.Deferred.prototype.callback = doh.Deferred.prototype.resolve = function (result) {
        this._resolved = true;
        this._result = result;
        this.callbacks.forEach(function (callback) {
            callback.onSuccess(this._result);
        }, this);
    };

    doh.Deferred.prototype.errback = doh.Deferred.prototype.reject = function (error) {
        this._resolved = true;
        this._failed = true;
        this._result = error;
        this.callbacks.forEach(function (callback) {
            callback.onFailure(this._result);
        }, this);
    };

    doh.Deferred.prototype.getTestCallback = function (func) {
        var self = this;
        return function () {
            func.apply(this, arguments);
            self.callback(true);
        };
    };

    doh.Deferred.prototype.getTestErrback = function (func) {
        return func;
    };

    doh.assertTrue = assert.isTrue;
    doh.assertFalse = assert.isFalse;
    doh.assertEqual = assert.isEqual;
    doh.assertNotEqual = assert.isNotEqual;

    this.doh = doh;
    return doh;
});
