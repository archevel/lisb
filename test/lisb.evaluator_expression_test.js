(function() {
"use strict";
var nodeunit = require('nodeunit');


require('../src/lisb.evaluator.js');
require('../src/parser/lisb.statements.js');
require('../src/parser/lisb.parser.js');


var simpleTestValues = {
    '-1':-1,
    '0':0,
    '1':1,
    '9123.3': 9123.3,
    '"a string"': "a string",
    "'a-symbol": new lisb.Symbol(new lisb.Name("a-symbol")),
    "#t": true,
    "#f": false
};
exports.expressions = nodeunit.testCase({

    "evaluates simple expessions": function(test) {
        for (var input in simpleTestValues) {
            var actual = lisb.evaluate(input);

            test.deepEqual(actual, simpleTestValues[input]);
        }

        test.done();
    },

    "evaluates calls to predefined functions": function(test) {
        var actual = lisb.evaluate('(> 3 1)');
        test.strictEqual(actual, true);

        actual = lisb.evaluate('(> 1 3)');
        test.strictEqual(actual, false);

        actual = lisb.evaluate('(> 67 67)');
        test.strictEqual(actual, false);

        actual = lisb.evaluate('(< 12 67)');
        test.strictEqual(actual, true);

        actual = lisb.evaluate('(< 67 3)');
        test.strictEqual(actual, false);

        actual = lisb.evaluate('(< 67 67)');
        test.strictEqual(actual, false);

        actual = lisb.evaluate('(+ 25 25)');
        test.strictEqual(actual, 50);

        actual = lisb.evaluate('(+ -12 25)');
        test.strictEqual(actual, 13);

        actual = lisb.evaluate('(+ 0.1 0.2)');
        test.notEqual(actual, 0.3);
        test.strictEqual(actual, 0.1 + 0.2); // Same arithmetic used as in js... 0.1 + 0.2 !== 0.3

        test.done();
    },

    "evaluates arguments to calls to predefined functions": function(test) {
        var actual = lisb.evaluate('(define a 3) (+ a 24.0)');
        test.strictEqual(actual, 27.0);

        test.done();
    },

    "a functions can be passed as values and evaluated":function(test) {
        var actual = lisb.evaluate('(define (give-func) (lambda (y) (+ y y))) ((give-func) 20)');

        test.strictEqual(actual, 40);
        test.done();
    },

    "recursive calls works": function(test) {
        var actual = lisb.evaluate('(define (recurse-curse a) (if (< a 5) (recurse-curse (+ a 1)) a)) (recurse-curse 0)');
        test.strictEqual(actual, 5);

        test.done();
    },

    "vanilla js can call a function defined in LISB":function(test) {

        var lambda = lisb.evaluate("(define x 100) (lambda (y) (+ x y) )");
        test.strictEqual(lambda(1), 101);
        test.strictEqual(lambda(2), 102);
        test.strictEqual(lambda(100.2), 200.2);

        test.done();
    },

    "javascript functions can be called":function(test) {
        global.myFunc = function() { return 3; };
        var actual = lisb.evaluate("(myFunc)");

        test.strictEqual(actual, 3);

        test.strictEqual(lisb.evaluate('(eval "1 + 2")'), 3); // Tihi! :)

        test.done();
    },

    "an error occurs if value not found for parameter": function (test) {
        test.throws(function() {
            lisb.evaluate('(define (x y z) 5) (x 99)');
        }, function(e) {
            return e instanceof Error && e.message === "Procedure x: expects 2 arguments, given 1: 99"; 
        });

        test.throws(function() {
            lisb.evaluate('(define (x y z) 5) (x)');
        }, function(e) {return e instanceof Error && e.message === "Procedure x: expects 2 arguments, given 0"; });

        test.throws(function() {
            lisb.evaluate('(define (somenameyname y z) 5) (somenameyname)');
        }, function(e) {return e instanceof Error && e.message === "Procedure somenameyname: expects 2 arguments, given 0"; });

        test.throws(function() {
            lisb.evaluate('((lambda (y z) 5) 9 8 7)');
        }, function(e) {
            return e instanceof Error && e.message === "#<procedure>: expects 2 arguments, given 3: 9 8 7"; 
        });
        test.done();
    },

    "unbound identifiers yield an error when evaluated": function(test) {
        test.throws(function() {
            lisb.evaluate('x');
        }, function(e) {
            return e instanceof Error && e.message === "Reference to undefined identifier: x"; 
        });
        test.throws(function() {
            lisb.evaluate('aina');
        }, function(e) {
            return e instanceof Error && e.message === "Reference to undefined identifier: aina"; 
        });
        test.done();
    },

});

}());