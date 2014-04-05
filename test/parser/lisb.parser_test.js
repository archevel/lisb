(function() {
"use strict"
var nodeunit = require('nodeunit'),
    lisb = require('../../src/parser/lisb.parser');

exports['parser'] = nodeunit.testCase({
    'simple integer value': function(test) {
        var ast = lisb.parse("5"),
            num = ast[0];
        test.strictEqual(num['type'], 'num');
        test.strictEqual(num['value'],  5);
        test.done();
    },
    'negative integer value': function(test) {
        var ast = lisb.parse("-5"),
            num = ast[0];
        test.strictEqual(num['type'], 'num');
        test.strictEqual(num['value'], -5);
        test.done();
    },
    'simple float value': function(test) {
        var ast = lisb.parse("6.001"),
            num = ast[0];
        test.strictEqual(num['type'], 'num');
        test.strictEqual(num['value'],  6.001);
        test.done();
    },
    'negative float value': function(test) {
        var ast = lisb.parse("-23456.789"),
            num = ast[0];
        test.strictEqual(num['type'], 'num');
        test.strictEqual(num['value'], -23456.789);
        test.done();
    },

    'simple identifier': function(test) {
        var ast = lisb.parse("a"),
            identifier = ast[0];
        test.strictEqual(identifier['type'], 'identifier');
        test.strictEqual(identifier['name'], 'a');
        test.done();
    },

    'allowed complex identifier': function(test) {
        var complex_names = [
            "abcdefgklmnopqrstuvxyz", 
            "ABCDEFGKLMNOPQRSTUVXYZ",
            // some symbols
            "*",
            "$",
            "¤",
            "!",
            "?",
            "&",
            "§",
            "+",
            "\\",
            "/",
            "<",
            ">",
            "|",
            "*",
            "~",
            "^",
            "-",
            "=",
            "%",
            // combinations
            "a2*",
            "--a",
            "-a-",
            "--2",
            "--20-"
        ];

        for (var i = 0; i < complex_names.length; i++) {
            var ast = lisb.parse(complex_names[i]),
                identifier = ast[0];
            test.strictEqual(identifier['type'], 'identifier');
            test.strictEqual(identifier['name'], complex_names[i]);
        }

        var long_combined_name = complex_names.join("");
        ast = lisb.parse(long_combined_name),
            identifier = ast[0];

        test.strictEqual(identifier['type'], 'identifier');
        test.strictEqual(identifier['name'], long_combined_name);

        test.done();
    },

    'several values': function(test) {
        var ast = lisb.parse("-99.7 2 -100 7.4"),
            expectedValues = [-99.7, 2,-100, 7.4];
        for(var i = 0; i < ast.length; i++) {
            var num = ast[i];
            test.strictEqual(num['type'], 'num');
            test.strictEqual(num['value'], expectedValues[i]);
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
            lisb.parse("(define x)");
        });
        test.done();
    },
    'define function': function(test) {
        var ast = lisb.parse("(define (x a) a)"),
            def = ast[0];
        test.strictEqual(def['type'], 'function_def');
        test.strictEqual(def['name'], 'x');
        test.deepEqual(def['params'], ['a']);
        test.ok(def.hasOwnProperty('body'));
        test.done();
    },
    'define multi-argument function': function(test) {
        var ast = lisb.parse("(define (fun a b c d) a)"),
            def = ast[0];
        test.strictEqual(def['type'], 'function_def');
        test.strictEqual(def['name'], 'fun');
        test.deepEqual(def['params'], ['a', 'b', 'c', 'd']);
        test.ok(def.hasOwnProperty('body'));
        test.done();
    },
    'function call or literals not allowed as identifier in function definition': function(test) {
        test.throws(function() {
            lisb.parse("(define ((fun a) b c d) a)");
        });
        test.throws(function() {
            lisb.parse("(define (4 b c d) a)");
        });
        test.done();
    },
    'define function with function call as body': function(test) {
        var ast = lisb.parse("(define (fun a b c d) (+ a b c d 10))"),
            body = ast[0]['body'];

        test.strictEqual(body[0]['type'], 'invocation')
        test.deepEqual(body[0]['func'], {'type': 'identifier', 'name':'+'})
        test.deepEqual(body[0]['args'], [{'type': 'identifier', 'name': 'a'}, {'type': 'identifier', 'name': 'b'}, {'type': 'identifier', 'name': 'c' }, {'type': 'identifier', 'name': 'd'}, {'type': 'num', 'value': 10 }]);

        test.done();

    },
    'function body can contain several nested definitions': function(test) {
        var ast = lisb.parse("(define (f a) (define d 10) (define (x b) (+ a  (* b d))) (x a))"),
            body = ast[0]['body'];

        test.strictEqual(body.length, 3)
        test.deepEqual(body[0], {'type': 'variable_def', 'name':'d', 'value': { 'type': 'num', 'value': 10}})

        test.done();
    },

    'function body must end with expression': function(test) {
        
        test.throws(function() {
            lisb.parse("(define (f a) (define d 10) (define (x b) (+ a  (* b d))) )");
        }); 

        test.done();
    },

    'strings are valid values': function(test) {
        var strings = [
                    {input:'""', output:''}, 
                    {input: '"Heelo"', output:"Heelo"},
                    {input: '"This \\"should\\" also work"', output:'This "should" also work'},
                    {input: '"This \\nshould\\n also work"', output:"This \nshould\n also work"}
                    ]
        for (var i = 0; i < strings.length; i++) {
            var ast = lisb.parse(strings[i].input);
            test.deepEqual(ast[0], {'type': 'string', 'value': strings[i].output });
        }
        test.done();
    },
    'strings must be on single line and cant escape into JavaScript': function(test) {
        test.throws(function() {
            lisb.parse('"hello\n world"')
        });

        test.throws(function() {
            lisb.parse('"hello world\\"')
        });

        test.throws(function() {
            lisb.parse('"hello world\\"console.log("FOOOOOOO");""')
        });
        test.done();
    },

    'symbols are valid values': function(test) {
        var validSymbols = [
                    {input:"'aoe", output:"aoe"}, 
                    {input: "'Heelo", output:"Heelo"},
                    ]
        for (var i = 0; i < validSymbols.length; i++) {
            var ast = lisb.parse(validSymbols[i].input);
            test.deepEqual(ast[0], {'type': 'symbol', 'name': validSymbols[i].output });
        }
        test.done();  
    },

    'invalid symbols throws parse error': function(test) {
        test.throws(function() {
            lisb.parse("';")
        });
        test.throws(function() {
            lisb.parse("''")
        });
        test.throws(function() {
            lisb.parse("'.")
        });
        test.done();
    },

    'numeric "symbols" should be treated as numbers': function(test) {
        var numbersInSymbols = [
                    {input:"'2.01", output:2.01}, 
                    {input: "'2", output:2},
                    {input: "'-3", output:-3},
                    {input: "'-0.0000001", output:-0.0000001},
                    ]
        for (var i = 0; i < numbersInSymbols.length; i++) {
            var ast = lisb.parse(numbersInSymbols[i].input);
            test.deepEqual(ast[0], {'type': 'num', 'value': numbersInSymbols[i].output });
        }
        test.done();  
    }
    // comments

    // conditionals
});


}());

