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
    "'a-symbol": new lisb.SYMB("a-symbol"),
    "#t": true,
    "#f": false
};


exports.evaluator = nodeunit.testCase({

    'evaluates simple expessions': function(test) {
        for (var input in simpleTestValues) {
            var actual = lisb.evaluate(input);

            test.deepEqual(actual, simpleTestValues[input]);
        }

        test.done();
    },

    "evaluates a definition to it's value": function(test) {

        var script = "(define x INPUT) x";


        for (var input in simpleTestValues) {
            var inputScript = script.replace('INPUT', input);
            var actual = lisb.evaluate(inputScript);

            test.deepEqual(actual, simpleTestValues[input]);
        }

        test.done();
    },

    "evaluates a definition to it's value in a script": function(test) {

        var script = '"some other script stuff" (define x INPUT) x';

        for (var input in simpleTestValues) {
            var inputScript = script.replace('INPUT', input);
            var actual = lisb.evaluate(inputScript);

            test.deepEqual(actual, simpleTestValues[input]);
        }

        test.done();
    },

    "evaluates to the correct result when there are several definitions": function(test) {

        var actual = lisb.evaluate("(define a 1) (define b 2) a");
        test.strictEqual(actual, 1);

        actual = lisb.evaluate("(define a 1) (define b 2) b");
        test.strictEqual(actual, 2);

        test.done();
    },

    "definitions have 'undefined' as their value": function(test) {
        var actual = lisb.evaluate("(define b 2)");
        test.strictEqual(actual, undefined);

        test.done();        
    },


    "assignments can be used to alter the value of a previous definition": function(test) {

        var actual = lisb.evaluate("(define a 1) (set! a 2) a");
        test.strictEqual(actual, 2);

        test.done();
    },

    "assignments can not be used to define new variables": function(test) {
        test.throws(function() {
            lisb.evaluate("(set! a 2) a");
        });

        test.done();
    },

    "assignments have 'undefined' as their value": function(test) {
        var actual = lisb.evaluate("(define a 1) (set! a 2)");
        test.strictEqual(actual, undefined);

        test.done();
    },

    "variables can be used in definitions": function(test) {
        var script = "(define a INPUT) (define b a) b";
        for (var input in simpleTestValues) {
            var inputScript = script.replace('INPUT', input);
            var actual = lisb.evaluate(inputScript);

            test.deepEqual(actual, simpleTestValues[input]);
        }

        test.done();

    },

    "variables can be used in assignments": function(test) {
        var script = "(define a INPUT) (define b 3) (set! b a) b";
        for (var input in simpleTestValues) {
            var inputScript = script.replace('INPUT', input);
            var actual = lisb.evaluate(inputScript);

            test.deepEqual(actual, simpleTestValues[input]);
        }

        test.done();

    },

    "evaluates if expressions": function(test) {
        var actual = lisb.evaluate("(if #t 1)");
        test.strictEqual(actual, 1);

        actual = lisb.evaluate("(if #t 2)");
        test.strictEqual(actual, 2);

        actual = lisb.evaluate('(if #f 2 "alfonso")');
        test.strictEqual(actual, "alfonso");

        actual = lisb.evaluate("(if 'boll 2)");
        test.strictEqual(actual, 2);

        actual = lisb.evaluate('(if "boll" 3)');
        test.strictEqual(actual, 3);

        actual = lisb.evaluate('(if 0 4)');
        test.strictEqual(actual, 4);

        actual = lisb.evaluate('(if -1 5)');
        test.strictEqual(actual, 5);

                actual = lisb.evaluate('(if 9991 5 "some string")');
        test.strictEqual(actual, 5);

        test.done();        
    },

    "variables can be used in if expressions": function(test) {
        var actual = lisb.evaluate('(define a #t) (if a 5)');
        test.strictEqual(actual, 5);

        actual = lisb.evaluate('(define a #f) (if a 5 6)');
        test.strictEqual(actual, 6);

        test.done();
    },

    "it's ok to use undefined variables if they are in branches that are not executed": function(test) {
        var actual = lisb.evaluate('(define a #t) (if a "THIS SHOULD BE THE RESULT" an-undefined-and-unused-variable-that-wont-be-evaluated)');
        test.strictEqual(actual, "THIS SHOULD BE THE RESULT");

        test.done();
    },

    "if expressions evaluate their consequents":function(test) {
        var actual = lisb.evaluate('(define a #t) (if #t a)');
        test.strictEqual(actual, true);   

        actual = lisb.evaluate('(define a #t) (if #f "a string" a)');
        test.strictEqual(actual, true);   
        test.done();
    },

    "cond expressions selects the correct branch": function(test) {
        var actual = lisb.evaluate('(cond (#t "this branch is chosen"))');
        test.strictEqual(actual, "this branch is chosen");   

        actual = lisb.evaluate('(cond (#f "bah!") (#t "a value"))');
        test.strictEqual(actual, "a value");   

        actual = lisb.evaluate('(cond (#f "bah!") (#f "a value") (#t 1))');
        test.strictEqual(actual, 1);   
        
        actual = lisb.evaluate('(cond (#f "bah!") (#t "middle branch") (#f 1))');
        test.strictEqual(actual, "middle branch");   
        
        actual = lisb.evaluate('(cond \n    (#f "bah!")\n    (#f "middle branch")\n    (#f 1)\n    (else 99))');
        test.strictEqual(actual, 99);   

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

    "defined functions can be called": function(test) {
        var actual = lisb.evaluate('(define (my-gt a b) (> a b)) (my-gt 2 4)');
        test.strictEqual(actual, false);

        actual = lisb.evaluate('(define (my-gt a b) (> a b)) (my-gt 1000 10)');
        test.strictEqual(actual, true);

        // TODO: add tests so we ensure the defined function is called.

        test.done();
    },

    "lambda functions can be called": function(test) {
        var actual = lisb.evaluate('((lambda (a b) (> a b)) 3 4)');
        test.strictEqual(actual, false);

        actual = lisb.evaluate('((lambda (a b) (+ a b)) 7 14)');
        test.strictEqual(actual, 21);

        test.done();
    }

});

}());