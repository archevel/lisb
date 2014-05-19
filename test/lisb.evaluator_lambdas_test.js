(function() {
"use strict";
var nodeunit = require('nodeunit');


require('../dist/lisb.js');

var simpleTestValues = {
    '-1':-1,
    '0':0,
    '1':1,
    '9123.3': 9123.3,
    '"a string"': "a string",
    "'a-symbol": new lisb.Quote(new lisb.Name("a-symbol")),
    "#t": true,
    "#f": false
};
exports.lambdas = nodeunit.testCase({

    "lambda functions can be called": function(test) {
        var actual = lisb.evaluate('((lambda (a b) (> a b)) 3 4)');
        test.strictEqual(actual, false);

        actual = lisb.evaluate('((lambda (a b) (+ a b)) 7 14)');
        test.strictEqual(actual, 21);

        test.done();
    },
    "lambda functions works with different parameter names": function(test) {
        var actual = lisb.evaluate('((lambda (c d) (+ d c)) 7 14)');
        test.strictEqual(actual, 21);

        test.done();
    },

    "let expressions bind the params to their values": function(test) {
        var script = "(let ((a TEST_VAL)) a)";
        for (var testVal in simpleTestValues) {
            var actual = lisb.evaluate(script.replace("TEST_VAL", testVal));
            test.deepEqual(actual, simpleTestValues[testVal]);
        }


        test.done();
    },

    "lambdas body can't end with definition": function(test) {
        test.throws(function(){
            lisb.evaluate("(lambda (x) (define z x))");
        }, function(e) {
            return e instanceof Error && e.message === "No expression after a sequence of internal definitions in: ((define z x))";
        });

        test.throws(function(){
            lisb.evaluate("(lambda (x) (define identityFunc (x) x))");
        }, function(e) {
            return e instanceof Error && e.message === "No expression after a sequence of internal definitions in: ((define identityFunc (x) x))";
        });

        test.done();
    },

});

}());