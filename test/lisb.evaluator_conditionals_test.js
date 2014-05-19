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
exports.conditionals = nodeunit.testCase({

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

    "if-conditionals without consequent fails": function(test) {
        test.throws(function() {
            lisb.evaluate("(if )");
        }, function(e) {
            return e instanceof Error && e.message === "Bad syntax (has 0 parts after keyword) in: (if)";
        });

        test.throws(function() {
            lisb.evaluate("(if #f    )");
        }, function(e) {
            return e instanceof Error && e.message === "Bad syntax (has 1 part after keyword) in: (if #f)";
        });
        test.done();
    },

    "cond-conditionals yield undefined value when they have no parts after keyword": function(test) {
        var res = lisb.evaluate("(cond )");
        test.strictEqual(res, undefined);

        test.done();
    },

});

}());