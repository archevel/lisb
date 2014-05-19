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
exports.js_interop = nodeunit.testCase({

    "javascript objects' properties can be accessed with strings": function(test) {
        var objectKeys = ["foo", "--123!!!bar", '?'];
        for(var i = 0; i < objectKeys.length; i++) {
            for (var testValue in simpleTestValues) {
                
                global.myObject = {};
                var objectKey = objectKeys[i];
                var expected = simpleTestValues[testValue];
                global.myObject[objectKey] = expected;
                var actual = lisb.evaluate('(myObject "' + objectKey +'")');
                test.strictEqual(actual, expected);
                
            }
        }

        delete global.myObject;
        test.done();
    },

    "javascript objects' properties can be assigned to with symbols and strings": function(test) {
        var objectKeys = ["biz", "_", 'hello?'];
        for(var i = 0; i < objectKeys.length; i++) {
            for (var testValue in simpleTestValues) {
                
                global.myObject = {};
                var objectKey = objectKeys[i];
                var expected = simpleTestValues[testValue];

                var actual = lisb.evaluate('(myObject "' + objectKey + '" ' + testValue + ')');
                test.deepEqual(global.myObject[objectKey], expected);
                
            }
        }

        delete global.myObject;
        test.done();
    },

    "assignment to javascript object yields the value of the assigned expression": function(test) {
        global.myObject = {};
        var actual = lisb.evaluate("(myObject \"foo\" 1)");
        test.strictEqual(actual, 1);
        
        actual = lisb.evaluate("(myObject \"foo\" 'some_val)");
        test.deepEqual(actual, new lisb.Quote(new lisb.Name('some_val')));

        delete global.myObject;
        test.done();
    },

    "for javascript objects values and keys are evaluated": function(test) {

        global.myObject = {};
        lisb.evaluate('(myObject "biz" (+ 1 2))');
        test.strictEqual(global.myObject.biz, 3);

        global.myObject = {};
        lisb.evaluate('(myObject ((lambda (x) x) "floppety") (+ 1 2))');
        test.strictEqual(global.myObject.floppety, 3);

        test.done();
    },


    "numbers can also be used as keys to objects/arrays": function(test) {
        global.Biz = ["some value", 33];

        
        var actual = lisb.evaluate("(Biz 0)");
        test.strictEqual(actual, global.Biz[0]);

        lisb.evaluate("(Biz 1 3)");
        test.strictEqual(global.Biz[1], 3);
        
        delete global.Biz;
        test.done();
    },

    "call to a javascript object require one to two arguments": function(test) {
        global.Hipster = {};

        test.throws(function() {
            lisb.evaluate("(Hipster)");
        }, function(e) {
            return e.message === "Javascript objects only takes 1 or 2 arguments and 0 arguments was given.";
        });

        test.throws(function() {
            lisb.evaluate("(Hipster 'fiz 1 2)");
        }, function(e) {
            return e.message === "Javascript objects only takes 1 or 2 arguments and 3 arguments was given.";
        });
        delete global.Hipster;
        test.done();

    },

});


}());