(function() {
"use strict"
var nodeunit = require('nodeunit'),
    lisb = require('../../src/parser/lisb.parser');

exports['parser'] = nodeunit.testCase({
    'simple integer value': function(test) {
        var ast = lisb.parse("5"),
            num = ast[0];
        test.ok(num.hasOwnProperty('num'));
        test.strictEqual(num['num'],  5);
        test.done();
    },
    'negative integer value': function(test) {
        var ast = lisb.parse("-5"),
            num = ast[0];
        test.strictEqual(num['num'], -5);
        test.done();
    },
    'simple float value': function(test) {
        var ast = lisb.parse("6.001"),
            num = ast[0];
        test.ok(num.hasOwnProperty('num'));
        test.strictEqual(num['num'],  6.001);
        test.done();
    },
    'negative float value': function(test) {
        var ast = lisb.parse("-23456.789"),
            num = ast[0];
        test.strictEqual(num['num'], -23456.789);
        test.done();
    },
    'several values': function(test) {
        var ast = lisb.parse("-99.7 2 -100 7.4"),
            expectedValues = [-99.7, 2,-100, 7.4];
        for(var i = 0; i < ast.length; i++) {
            var num = ast[i];
            test.strictEqual(num['num'], expectedValues[i]);
        }
        test.done();
    }, 
    'define variables': function(test) {
        var ast = lisb.parse("(define x 2)"),
            def = ast[0];
        test.strictEqual(def['type'], 'variable_def');
        test.strictEqual(def['name'], 'x');
        test.ok(def.hasOwnProperty('value'));
        test.done();
    },
    'define variable fails if no value provided': function(test) {
        test.throws(function() {
            lisb.parse("(define x)")
        });
        test.done();
    },
    'define function': function(test) {
        // var IDENTITY_FUNCTION = "(define x (a) (a)",
        //     ast = lisb.parse(IDENTITY_FUNCTION),
        //     def = ast[0];
        // test.strictEqual(def['type'], 'function_def');
        test.done();
    }
});


}());

