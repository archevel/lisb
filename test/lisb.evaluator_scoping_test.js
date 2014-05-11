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
exports.scoping = nodeunit.testCase({

    "local definitions shadows outer definitions": function(test) {
        var actual = lisb.evaluate('(define a-var "Upp trälar uti alla stater!") ((lambda () (define a-var 3) a-var))');

        test.strictEqual(actual, 3);
        test.done();
    },

    "outer definitions are not overwritten by local definitions in the outer scope": function(test) {
        var actual = lisb.evaluate('(define a-var "Som hungern bojor lagt uppå") ((lambda () (define a-var 3) a-var)) a-var');

        test.strictEqual(actual, "Som hungern bojor lagt uppå");
        test.done();
    },

    "when a parameter shadows another variable the value is restored after a call": function(test) {
        var actual = lisb.evaluate("(define (foo x) ((lambda (x) (+ x 1)) 3) x) (foo 1)");

        test.strictEqual(actual, 1);
        test.done();
    },

    "when a variable is shared between two functions they can both affect it":function(test) {
        var actual = lisb.evaluate("(define (x) (set! foo 20) 10 ) (define (y) foo) (define foo 12) (x) (y)");

        test.strictEqual(actual, 20);
        test.done();
    },
    
    "if variable is not found in environment, the javascript global scope should be checked": function(test) {
        global.Foo = 9000;

        var actual = lisb.evaluate("Foo");

        test.strictEqual(actual, 9000);
        
        delete global.Foo;
        test.done();
    },

    "a function can use the variables available in the scope it was defined":function(test) {
        var actual = lisb.evaluate('(define (give-func x) (lambda (y) (+ x y))) ((give-func 2) 20)');

        test.strictEqual(actual, 22);
        test.done();
    },
    
    "local definitions do not leak to outer scope": function(test) {
        test.throws(function() {
            lisb.evaluate('(define (z) (define x 3) 5) (z) x');
        }, function(e) {
            return e instanceof Error && e.message === "Reference to undefined identifier: x"; 
        });
        test.done();
    },

});

}());