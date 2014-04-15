
(function() {
"use strict"
var nodeunit = require('nodeunit');

global.lisb = global.lisb || {};
require('../../src/parser/lisb.parser.js');

exports['parser'] = nodeunit.testCase({
    'simple integer value': function(test) {
        var ast = lisb.parser.parse("5"),
            num = ast[0];
        test.strictEqual(num['type'], 'num');
        test.strictEqual(num['value'],  5);
        test.done();
    },
    'negative integer value': function(test) {
        var ast = lisb.parser.parse("-5"),
            num = ast[0];
        test.strictEqual(num['type'], 'num');
        test.strictEqual(num['value'], -5);
        test.done();
    },
    'simple float value': function(test) {
        var ast = lisb.parser.parse("6.001"),
            num = ast[0];
        test.strictEqual(num['type'], 'num');
        test.strictEqual(num['value'],  6.001);
        test.done();
    },
    'negative float value': function(test) {
        var ast = lisb.parser.parse("-23456.789"),
            num = ast[0];
        test.strictEqual(num['type'], 'num');
        test.strictEqual(num['value'], -23456.789);
        test.done();
    },

    'simple identifier': function(test) {
        var ast = lisb.parser.parse("a"),
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
            var ast = lisb.parser.parse(complex_names[i]),
                identifier = ast[0];
            test.strictEqual(identifier['type'], 'identifier');
            test.strictEqual(identifier['name'], complex_names[i]);
        }

        var long_combined_name = complex_names.join("");
        ast = lisb.parser.parse(long_combined_name),
            identifier = ast[0];

        test.strictEqual(identifier['type'], 'identifier');
        test.strictEqual(identifier['name'], long_combined_name);

        test.done();
    },

    'several values': function(test) {
        var ast = lisb.parser.parse("-99.7 2 -100 7.4"),
            expectedValues = [-99.7, 2,-100, 7.4];
        for(var i = 0; i < ast.length; i++) {
            var num = ast[i];
            test.strictEqual(num['type'], 'num');
            test.strictEqual(num['value'], expectedValues[i]);
        }
        test.done();
    }, 

    'define variables': function(test) {
        var ast = lisb.parser.parse("(define x 2)"),
            def = ast[0];
        test.strictEqual(def['type'], 'def');
        test.strictEqual(def['name'], 'x');
        test.ok(def.hasOwnProperty('value'));
        test.done();
    },
    'define variable fails if no value provided': function(test) {
        test.throws(function() {
            lisb.parser.parse("(define x)");
        });
        test.done();
    },
    'define function': function(test) {
        var ast = lisb.parser.parse("(define (x a) a)"),
            def = ast[0];
        test.strictEqual(def['type'], 'def');
        test.strictEqual(def['name'], 'x');
        test.deepEqual(def['value'], { 'type': 'lambda', 'params': [{'type':'identifier', 'name':'a' }], 'body': [{'type':'identifier', 'name': 'a'}]});
        test.done();
    },
    'define multi-argument function': function(test) {
        var ast = lisb.parser.parse("(define (fun a b c d) a)"),
            def = ast[0];
        test.strictEqual(def['type'], 'def');
        test.strictEqual(def['name'], 'fun');
        test.deepEqual(def['value']['params'], [{'type':'identifier', 'name':'a' }, {'type':'identifier', 'name':'b' }, {'type':'identifier', 'name':'c' }, {'type':'identifier', 'name':'d' }]);
        test.ok(def['value'].hasOwnProperty('body'));
        test.done();
    },
    'function call or literals not allowed as identifier in function definition': function(test) {
        test.throws(function() {
            lisb.parser.parse("(define ((fun a) b c d) a)");
        });
        test.throws(function() {
            lisb.parser.parse("(define (4 b c d) a)");
        });
        test.done();
    },
    'define function with function call as body': function(test) {
        var ast = lisb.parser.parse("(define (fun a b c d) (+ a b c d 10))"),
            body = ast[0]['value']['body'];

        test.strictEqual(body[0]['type'], 'invocation')
        test.deepEqual(body[0]['func'], {'type': 'identifier', 'name':'+'})
        test.deepEqual(body[0]['args'], [{'type': 'identifier', 'name': 'a'}, {'type': 'identifier', 'name': 'b'}, {'type': 'identifier', 'name': 'c' }, {'type': 'identifier', 'name': 'd'}, {'type': 'num', 'value': 10 }]);

        test.done();

    },
    'function body can contain several nested definitions': function(test) {
        var ast = lisb.parser.parse("(define (f a) (define d 10) (define (x b) (+ a  (* b d))) (x a))"),
            body = ast[0]['value']['body'];

        test.strictEqual(body.length, 3)
        test.deepEqual(body[0], {'type': 'def', 'name':'d', 'value': { 'type': 'num', 'value': 10}})

        test.done();
    },

    'function body must end with expression': function(test) {
        
        test.throws(function() {
            lisb.parser.parse("(define (f a) (define d 10) (define (x b) (+ a  (* b d))) )");
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
            var ast = lisb.parser.parse(strings[i].input);
            test.deepEqual(ast[0], {'type': 'string', 'value': strings[i].output });
        }
        test.done();
    },
    'strings must be on single line and cant escape into JavaScript': function(test) {
        test.throws(function() {
            lisb.parser.parse('"hello\n world"')
        });

        test.throws(function() {
            lisb.parser.parse('"hello world\\"')
        });

        test.throws(function() {
            lisb.parser.parse('"hello world\\"console.log("FOOOOOOO");""')
        });
        test.done();
    },

    'symbols are valid values': function(test) {
        var validSymbols = [
                    {input:"'aoe", output:"aoe"}, 
                    {input: "'Heelo", output:"Heelo"},
                    ]
        for (var i = 0; i < validSymbols.length; i++) {
            var ast = lisb.parser.parse(validSymbols[i].input);
            test.deepEqual(ast[0], {'type': 'symbol', 'name': validSymbols[i].output });
        }
        test.done();  
    },

    'invalid symbols throws parse error': function(test) {
        test.throws(function() {
            lisb.parser.parse("';")
        });
        test.throws(function() {
            lisb.parser.parse("''")
        });
        test.throws(function() {
            lisb.parser.parse("'.")
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
            var ast = lisb.parser.parse(numbersInSymbols[i].input);
            test.deepEqual(ast[0], {'type': 'num', 'value': numbersInSymbols[i].output });
        }
        test.done();  
    },

    '";" starts a comment that makes parser ignore the rest of the line': function(test) {
        var ast = lisb.parser.parse(";(define foos ball)");

        test.strictEqual(ast.length, 0);

        var ast = lisb.parser.parse("(define foos ball); hello");

        test.strictEqual(ast.length, 1);

        var ast = lisb.parser.parse("(+ ;comment \n a b c)");

        test.strictEqual(ast.length, 1);

        test.done();
    },

    "if conditional expressions can be parsed": function(test) {        
        var ast = lisb.parser.parse("(if true a)"),
            cond = ast[0];

        test.deepEqual(cond, { 
                'type': 'cond', 
                'clauses': [{ 
                    'type': 'clause', 
                    'predicate': {
                        'type':'identifier', 
                        'name':'true'
                    },
                    'consequent': {
                        'type':'identifier', 
                        'name':'a'
                    }
                }]
            });

        test.done();
    },

    "if conditional expression with else consequent": function(test) {
        var ast = lisb.parser.parse("(if false a b)"),
            cond = ast[0];

        test.deepEqual(cond, { 
            'type': 'cond', 
            'clauses': [{ 
                'type': 'clause', 
                'predicate': {
                    'type':'identifier', 
                    'name':'false'
                },
                'consequent': {
                    'type':'identifier', 
                    'name':'a'
                }
            },
            { 
                'type': 'else', 
                'consequent': {
                    'type':'identifier', 
                    'name':'b'
                }
            }]
        });

        test.done();          
    },

    "if conditional expressions function calls are valid predicates": function(test) {        
        var ast = lisb.parser.parse("(if (something o) a)"),
            cond = ast[0];

        test.deepEqual(cond, { 
                'type': 'cond', 
                'clauses': [{ 
                    'type': 'clause', 
                    'predicate': {
                        'type': 'invocation', 
                        'func': {'type': 'identifier', 'name':'something'},
                        'args': [{'type': 'identifier', 'name':'o'}]                        
                    },
                    'consequent': {
                        'type':'identifier', 
                        'name':'a'
                    }
                }]
            });

        test.done();
    },

    "cond conditional expressions can be parsed": function(test) {
        var ast = lisb.parser.parse("(cond (false a))"),
            cond = ast[0];

        test.deepEqual(cond, { 
                'type': 'cond', 
                'clauses': [{ 
                    'type': 'clause', 
                    'predicate': {
                        'type':'identifier', 
                        'name':'false'
                    },
                    'consequent': {
                        'type':'identifier', 
                        'name':'a'
                    }
                }]
            });

        test.done();
    },

    "cond conditional expressions can have several clauses": function(test) {
        var ast = lisb.parser.parse("(cond (false a) (true b))"),
            cond = ast[0];

        test.deepEqual(cond, { 
                'type': 'cond', 
                'clauses': [{ 
                    'type': 'clause', 
                    'predicate': {
                        'type':'identifier', 
                        'name':'false'
                    },
                    'consequent': {
                        'type':'identifier', 
                        'name':'a'
                    }
                },
                { 
                    'type': 'clause', 
                    'predicate': {
                        'type':'identifier', 
                        'name':'true'
                    },
                    'consequent': {
                        'type':'identifier', 
                        'name':'b'
                    }
                }]
            });

        test.done();
    },

    "cond conditional expression with else clause": function(test) {
        var ast = lisb.parser.parse("(cond (false x) (else  y))"),
            cond = ast[0];

        test.deepEqual(cond, { 
            'type': 'cond', 
            'clauses': [{ 
                'type': 'clause', 
                'predicate': {
                    'type':'identifier', 
                    'name':'false'
                },
                'consequent': {
                    'type':'identifier', 
                    'name':'x'
                }
            },
            { 
                'type': 'else', 
                'consequent': {
                    'type':'identifier', 
                    'name':'y'
                }
            }]
        });

        test.done();          
    },

    "cond conditional with only else clause": function(test) {
        var ast = lisb.parser.parse("(cond (else  y))"),
            cond = ast[0];

        test.deepEqual(cond, { 
            'type': 'cond', 
            'clauses': [{ 
                'type': 'else', 
                'consequent': {
                    'type':'identifier', 
                    'name':'y'
                }
            }]
        });

        test.done();
    },

    "conditionals without consequent fails": function(test) {
        test.throws(function() {
            lisb.parser.parse("(if )")
        });

        test.throws(function() {
            lisb.parser.parse("(cond )")
        });
        test.done();
    },

    "defines are not ok in conditionals": function(test) {   
        // TODO: Find out if these are interpreted as function invocations
        test.throws(function() {
            lisb.parser.parse("(if truthyvalue ((define x 4) x))"); 
        });
        test.throws(function() {
            lisb.parser.parse("(cond (truthyvalue ((define x 4) x)))");
        });
           
        test.throws(function() {
            lisb.parser.parse("(if ((define x 4) x)) value");
        });
        test.throws(function() {
            lisb.parser.parse("(cond (((define x 4) x) truthyvalue ))");
        });

        test.done();
    },

    "truth literals #t and #f are valid values": function(test) {
        var ast = lisb.parser.parse("#t"),
            bool = ast[0];
        test.deepEqual(bool, { 'type': 'boolean', 'value': true })

        ast = lisb.parser.parse("#f"),
        bool = ast[0];
        test.deepEqual(bool, { 'type': 'boolean', 'value': false })

        test.done();
    },

    "lambdas can be parsed": function(test) {
        var ast = lisb.parser.parse("(lambda () #t)"),
            lambda = ast[0];

        test.deepEqual(lambda, {'type': 'lambda', 'params': [], 'body': [{ 'type': 'boolean', 'value': true }] })
        test.done();
    },

    "lambdas can contain definitions": function(test) {
        var ast = lisb.parser.parse("(lambda (a b c) (define (k) (- b 99)) a)"),
             lambdaBody = ast[0].body;

        test.deepEqual(lambdaBody[0], { 
            'type': 'def', 
            'name': 'k',
            'value': { 
                'type': 'lambda',
                'params': [], 
                'body': [{ 
                    'type': 'invocation', 
                    'func': {
                        'type':'identifier', 
                        'name': '-'
                    }, 
                    'args': [{ 
                        'type': 
                        'identifier', 
                        'name': 'b' 
                    }, { 
                        'type': 'num', 
                        'value': 99 
                    }]
                }]
            }
        });
        test.done();
    },

    "lambdas can contain several statments": function(test) {
        var ast = lisb.parser.parse("(lambda (x) #t 1 3 (define z x) z)"),
            lambda = ast[0];

        test.deepEqual(lambda.body.length, 5);
        test.done();
    },
    
    "lambdas body can't end with definition": function(test) {
        test.throws(function(){
            lisb.parser.parse("(lambda (x) (define z x))");
        });

        test.throws(function(){
            lisb.parser.parse("(lambda (x) (define identityFunc (x) x))");
        });

        test.done();
    },

    // let

    "let is converted to lambda invoked with expression values": function(test) {
        var ast = lisb.parser.parse("(let ((x 3)) (+ x x))"),
            letExpr = ast[0];

        test.deepEqual(letExpr, {
            'type': 'invocation', 
            'func': { 
                'type': 'lambda', 
                'params': [ {
                    'type':'identifier', 
                    'name': 'x'
                }],
                'body': [{
                    'type': 'invocation',
                    'func': {
                        'type': 'identifier',
                        'name': '+'
                    },
                    'args': [{ 
                        'type': 'identifier', 
                        'name': 'x'
                    }, { 
                        'type': 'identifier', 
                        'name': 'x'
                    }]
                }]
            },
            'args': [{
                'type':'num', 
                'value': 3
            }]
        })

        test.done();
    }

    // TODO: Add more tests for let?
    //  - symbol lists
    //  - "complex" sample program, e.g. fibonacci
});


}());




