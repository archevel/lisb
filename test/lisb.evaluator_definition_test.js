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

exports.definitions = nodeunit.testCase({

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

    "variables can be used in definitions": function(test) {
        var script = "(define a INPUT) (define b a) b";
        for (var input in simpleTestValues) {
            var inputScript = script.replace('INPUT', input);
            var actual = lisb.evaluate(inputScript);

            test.deepEqual(actual, simpleTestValues[input]);
        }

        test.done();
    },

    "defined functions can be called": function(test) {
        var actual = lisb.evaluate('(define (my-gt a b) (> a b)) (my-gt 2 4)');
        test.strictEqual(actual, false);

        actual = lisb.evaluate('(define (my-gt a b) (> a b)) (my-gt 1000 10)');
        test.strictEqual(actual, true);

        actual = lisb.evaluate('(define (my-add a b) (+ a b)) (my-add 9 10)');
        test.strictEqual(actual, 19);

        test.done();
    },

    "defined functions with multiple statments in body will execute all statements": function(test) {
        var actual = lisb.evaluate('(define (my-gt a b) (define z 99) (+ z a b)) (my-gt 2 4)');
        test.strictEqual(actual, 105);        

        test.done();
    },

    "keywords can be redefined": function(test) {
        
        var keywords = ['define', 'set!', 'lambda', 'let', 'cond', 'if', 'else'];
        for (var i = 0; i < keywords.length; i++) {
            var kw = keywords[i];
            var actual = lisb.evaluate("(let ((" + kw + " (lambda (x) x))) (" + kw + " 2))");
            test.strictEqual(actual, 2);
            actual = lisb.evaluate("(define (" + kw + " x) x) (" + kw + " 2)");
            test.strictEqual(actual, 2);
        }
        
        test.done();
    },

    "variable definitions must have right amount of arguments": function(test) {
        test.throws(function() {
            lisb.evaluate("(define x)");
        }, function(e) {
            return e.message === "Bad syntax (missing expression after identifier) in: (define x)";
        });
        
        test.throws(function() {
            lisb.evaluate("(define x 1 2)");
        }, function(e) {
            return e.message === "Bad syntax (multiple expressions after identifier) in: (define x 1 2)";
        });
        
        test.done();
    },

    "variable definitions must have a name": function(test) {
        test.throws(function() {
            lisb.evaluate("(define 'x 1)");
        }, function(e) {
            return e instanceof Error && e.message ===  "Bad syntax at: 'x in: (define 'x 1)"; 
        });
        
        test.throws(function() {
            lisb.evaluate('(define "x" 1)');
        }, function(e) {
            return e instanceof Error && e.message === 'Bad syntax at: "x" in: (define "x" 1)'; 
        });
        
        test.throws(function() {
            lisb.evaluate("(define '(brainz) 1)");
        }, function(e) {
            return e instanceof Error && e.message ===  "Bad syntax at: '(brainz) in: (define '(brainz) 1)"; 
        });

        test.done();
    },

    "function definitions must have right amount of arguments": function(test) {

        test.throws(function() {
            lisb.evaluate("(define (x))");
        }, function(e) {
            return e instanceof Error && e.message === "Bad syntax (no expressions for procedure body) in: (define (x))";
        });

        test.throws(function() {
            lisb.evaluate("(define () 1)");
        }, function(e) {
            return e instanceof Error && e.message === "Bad syntax at: () in: (define () 1)";
        });
        test.done();
    },

    "defines are not ok in conditionals": function(test) {   
        test.throws(function() {
            lisb.evaluate("(if 'truthyvalue ((define x 4) x))"); 
        }, function(e) {
            return e instanceof Error && e.message === "Statement '((define x 4) x)' was called, but is not currently defined";
        });
        test.throws(function() {
            lisb.evaluate('(cond ("truthyvalue" ((define x "4") x)))');
        }, function(e) {
            return e instanceof Error && e.message === "Statement '((define x \"4\") x)' was called, but is not currently defined";
        });
           
        test.throws(function() {
            lisb.evaluate('(if ((define x 99) x) "value")');
        }, function(e) {
            return e instanceof Error && e.message === "Statement '((define x 99) x)' was called, but is not currently defined";
        });
        test.throws(function() {
            lisb.evaluate("(cond (((define x #t) x) 'truthyvalue ))");
        }, function(e) {
            return e instanceof Error && e.message === "Statement '((define x #t) x)' was called, but is not currently defined";
        });

        test.done();
    },

    "function call or literals not allowed as identifier in function definition": function(test) {
        test.throws(function() {
            lisb.evaluate("(define ((fun a) b c d) a)");
        }, function(e) {
            return e instanceof Error && e.message === "Bad syntax at: ((fun a) b c d) in: (define ((fun a) b c d) a)";
        });
        test.throws(function() {
            lisb.evaluate("(define (4 b c d) a)");
        }, function(e) {
            return e instanceof Error && e.message === "Bad syntax at: (4 b c d) in: (define (4 b c d) a)";
        });
        test.done();
    },

    "variable definitions can not use literals as identifiers": function(test) {
        test.throws(function() {
            lisb.evaluate("(define 4 #t)");
        });
        test.throws(function() {
            lisb.evaluate('(define "four" 99)');
        });
        test.throws(function() {
            lisb.evaluate("(define 'symb 13)");
        });
        test.throws(function() {
            lisb.evaluate("(define #f 13)");
        });
        test.done();
    },

    "function body can not end with definition": function(test) {
        test.throws(function() {
            lisb.evaluate("(define (f a) (define d 10))");
        }, function(e) {
            return e instanceof Error && e.message === "No expression after a sequence of internal definitions in: ((define d 10))";
        }); 

        test.throws(function() {
            lisb.evaluate("(define (f a) (define d 10) (define (x b) (+ a (* b d))))");
        }, function(e) {
            return e instanceof Error && e.message === "No expression after a sequence of internal definitions in: ((define d 10) (define (x b) (+ a (* b d))))";
        }); 

        test.done();
    },

});
}());