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
exports.assignment = nodeunit.testCase({

    "assignments can be used to alter the value of a previous definition": function(test) {

        var actual = lisb.evaluate("(define a 1) (set! a 2) a");
        test.strictEqual(actual, 2);

        test.done();
    },

    "assignments have 'undefined' as their value": function(test) {
        var actual = lisb.evaluate("(define a 1) (set! a 2)");
        test.strictEqual(actual, undefined);

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

    "assignments can not be used to define new variables": function(test) {
        test.throws(function() {
            lisb.evaluate("(set! a 2) a");
        }, function(e) {
            return e instanceof Error && e.message === "Can not set undefined variable: a"; 
        });

        test.done();
    },

    "variables defined in the global scope can't be assigned values with set!": function(test) {
        global.Foo = 9000;
        test.throws(function() {
            lisb.evaluate("(set! Foo 1)");
        }, function(e) {
            return e instanceof Error && e.message === "Can not set undefined variable: Foo"; 
        });
        test.strictEqual(global.Foo, 9000);
        
        delete global.Foo;
        test.done();
    },

    "assignment must reference a identifier and end with expression":function(test) {
        test.throws(function() {
            lisb.evaluate("(set!)");
        }, function(e) {
           return e instanceof Error && e.message === "Bad syntax (has 0 parts after keyword) in: (set!)";
        });

        test.throws(function() {
            lisb.evaluate("(set! x )");
        }, function(e) {
           return e instanceof Error && e.message === "Bad syntax (has 1 part after keyword) in: (set! x)";
        });

        test.done();    
    },
});

}());