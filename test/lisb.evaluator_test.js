(function() {
"use strict"
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
}


exports['evaluator'] = nodeunit.testCase({

    'evaluates simple expessions': function(test) {
        for (var input in simpleTestValues) {
            var actual = lisb.evaluate(input);

            test.deepEqual(actual, simpleTestValues[input])
        }

        test.done();
    },

    "evaluates a definition to it's value": function(test) {

        var script = "(define x INPUT) x";


        for (var input in simpleTestValues) {
            var inputScript = script.replace('INPUT', input);
            var actual = lisb.evaluate(inputScript);

            test.deepEqual(actual, simpleTestValues[input])
        }

        test.done();
    },

    "evaluates a definition to it's value in a script": function(test) {

        var script = '"some other script stuff" (define x INPUT) x';

        for (var input in simpleTestValues) {
            console.log("Will be:", input);
            var inputScript = script.replace('INPUT', input);
            var actual = lisb.evaluate(inputScript);

            test.deepEqual(actual, simpleTestValues[input])
        }

        test.done();
    },

    "evaluates to the correct result when there are several definitions": function(test) {

        var actual = lisb.evaluate("(define a 1) (define b 2) a");
        test.strictEqual(actual, 1)

        var actual = lisb.evaluate("(define a 1) (define b 2) b");
        test.strictEqual(actual, 2)

        test.done();
    },


});

}());