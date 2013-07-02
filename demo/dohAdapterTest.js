
define([
    "doh"
], function (doh) {
    doh.register("Testing.DOH.Suites", [
        function testFailingTestPoint1() {
            doh.assertTrue(true, "Some message");
            doh.assertFalse(false, "Another assert");
        },

        function testAnotherTestPoint() {
            doh.assertEqual({a: "a", b: 1}, {a: "a", b: 1}, "Object equals");
        },

        function testAsyncTest() {
            var deferred = new doh.Deferred();
            setTimeout(function () {
                deferred.callback(true);
            }, 0);
            return deferred;
        },

        function testFailingAsyncTest2() {
            var deferred = new doh.Deferred();
            setTimeout(deferred.getTestErrback(function () {
            }), 0);
            setTimeout(deferred.getTestCallback(function () {
                doh.assertTrue(true, "Test with callback wrapper")
            }), 10);
            return deferred;
        }
    ]);
});