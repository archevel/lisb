
(function() {
"use strict";
var nodeunit = require('nodeunit');

global.lisb = global.lisb || {};
require('../../src/parser/lisb.statements.js');
require('../../src/parser/lisb.parser.js');

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
            "_",
            // combinations
            "a2*",
            "--a",
            "-a-",
            "--2",
            "--20-" ];


exports.parser = nodeunit.testCase({
    'simple integer value': function(test) {
        var ast = lisb.parser.parse("5"),
            num = ast[0];
        test.strictEqual(typeof num, 'number' );
        test.strictEqual(num,  5);
        test.done();
    },
    'negative integer value': function(test) {
        var ast = lisb.parser.parse("-5"),
            num = ast[0];
        test.strictEqual(typeof num, 'number' );
        test.strictEqual(num, -5);
        test.done();
    },
    'simple float value': function(test) {
        var ast = lisb.parser.parse("6.001"),
            num = ast[0];
        test.strictEqual(typeof num, 'number' );
        test.strictEqual(num,  6.001);
        test.done();
    },
    'negative float value': function(test) {
        var ast = lisb.parser.parse("-23456.789"),
            num = ast[0];
        test.strictEqual(typeof num, 'number' );
        test.strictEqual(num, -23456.789);
        test.done();
    },

    'simple identifier': function(test) {
        var ast = lisb.parser.parse("a"),
            identifier = ast[0];
        test.ok(identifier instanceof lisb.ID);
        test.strictEqual(identifier.name, 'a');
        test.done();
    },

    'allowed "complex" identifiers': function(test) {

        for (var i = 0; i < complex_names.length; i++) {
            var ast = lisb.parser.parse(complex_names[i]),
                identifier = ast[0];
            test.ok(identifier instanceof lisb.ID);
            test.strictEqual(identifier.name, complex_names[i]);
        }

        test.done();
    },

    'all "complex" identifiers can be combined': function(test) {
        var long_combined_name = complex_names.join(""),
            ast = lisb.parser.parse(long_combined_name),
            identifier = ast[0];

        test.ok(identifier instanceof lisb.ID);
        test.strictEqual(identifier.name, long_combined_name);

        test.done();
    },

    'several values': function(test) {
        var ast = lisb.parser.parse("-99.7 2 -100 7.4"),
            expectedValues = [-99.7, 2,-100, 7.4];
        for(var i = 0; i < ast.length; i++) {
            var num = ast[i];
            test.strictEqual(typeof num, 'number' );
            test.strictEqual(num, expectedValues[i]);
        }
        test.done();
    }, 

    'define variables': function(test) {
        var ast = lisb.parser.parse("(define x 2)"),
            def = ast[0];
        test.ok(def instanceof lisb.DEF);
        test.strictEqual(def.name, 'x');
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
        test.ok(def instanceof lisb.DEF);
        test.strictEqual(def.name, 'x');
        test.deepEqual(def.value, new lisb.LAMBDA([new lisb.ID('a')], [new lisb.ID('a')]));
        test.done();
    },
    'define multi-argument function': function(test) {
        var ast = lisb.parser.parse("(define (fun a b c d) a)"),
            def = ast[0];
        test.ok(def instanceof lisb.DEF);
        test.strictEqual(def.name, 'fun');
        test.deepEqual(def.value.params, [new lisb.ID('a'), new lisb.ID('b'), new lisb.ID('c'), new lisb.ID('d')]);
        test.ok(def.value.hasOwnProperty('body'));
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
            body = ast[0].value.body;

        test.ok(body[0] instanceof lisb.CALL);
        test.deepEqual(body[0].func, new lisb.ID('+'));
        test.deepEqual(body[0].args, [new lisb.ID('a'), new lisb.ID('b'), new lisb.ID('c'), new lisb.ID('d'), 10 ]);

        test.done();

    },
    'function body can contain several nested definitions': function(test) {
        var ast = lisb.parser.parse("(define (f a) (define d 10) (define (x b) (+ a  (* b d))) (x a))"),
            body = ast[0].value.body;

        test.strictEqual(body.length, 3);
        test.deepEqual(body[0], new lisb.DEF('d', 10));

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
                    ];
        for (var i = 0; i < strings.length; i++) {
            var ast = lisb.parser.parse(strings[i].input);
            test.deepEqual(ast[0], strings[i].output );
        }
        test.done();
    },
    
    "consecutive strings are distinct expressions":function(test) {
        var ast = lisb.parser.parse('"hello" "world"');

        test.strictEqual(ast.length, 2);

        test.done();
    },

    'strings must be on single line and cant escape into JavaScript': function(test) {
        test.throws(function() {
            lisb.parser.parse('"hello\n world"');
        });

        test.throws(function() {
            lisb.parser.parse('"hello world\\"');
        });

        test.throws(function() {
            lisb.parser.parse('"hello world\\"console.log("FOOOOOOO");""');
        });
        test.done();
    },

    'symbols are valid values': function(test) {
        var validSymbols = [
                    {input:"'aoe", output:"aoe"}, 
                    {input: "'Heelo", output:"Heelo"},
                    ];
        for (var i = 0; i < validSymbols.length; i++) {
            var ast = lisb.parser.parse(validSymbols[i].input);
            test.ok(ast[0] instanceof lisb.SYMB);
            test.deepEqual(ast[0], new lisb.SYMB(validSymbols[i].output) );
        }
        test.done();  
    },

    'invalid symbols throws parse error': function(test) {
        test.throws(function() {
            lisb.parser.parse("';");
        });
        test.throws(function() {
            lisb.parser.parse("''");
        });
        test.throws(function() {
            lisb.parser.parse("'.");
        });
        test.done();
    },

    'numeric "symbols" should be treated as numbers': function(test) {
        var numbersInSymbols = [
                    {input:"'2.01", output:2.01}, 
                    {input: "'2", output:2},
                    {input: "'-3", output:-3},
                    {input: "'-0.0000001", output:-0.0000001},
                    ];

        for (var i = 0; i < numbersInSymbols.length; i++) {
            var ast = lisb.parser.parse(numbersInSymbols[i].input);
            test.deepEqual(ast[0], numbersInSymbols[i].output);
        }
        test.done();  
    },

    '";" starts a comment that makes parser ignore the rest of the line': function(test) {
        var ast = lisb.parser.parse(";(define foos ball)");

        test.strictEqual(ast.length, 0);

        ast = lisb.parser.parse("(define foos ball); hello");

        test.strictEqual(ast.length, 1);

        ast = lisb.parser.parse("(+ ;comment \n a b c)");

        test.strictEqual(ast.length, 1);

        test.done();
    },

    "if conditional expressions can be parsed": function(test) {        
        var ast = lisb.parser.parse("(if true a)"),
            cond = ast[0];

        test.deepEqual(cond, new lisb.COND([
                    new lisb.CLAUSE(new lisb.ID('true'), new lisb.ID('a'))
                ]));

        test.done();
    },

    "if conditional expression with else consequent": function(test) {
        var ast = lisb.parser.parse("(if false a b)"),
            cond = ast[0];

        test.deepEqual(cond, new lisb.COND([ 
                new lisb.CLAUSE(new lisb.ID('false'), new lisb.ID('a')),
                new lisb.CLAUSE(true, new lisb.ID('b'))]));

        test.done();          
    },

    "if conditional expressions function calls are valid predicates": function(test) {        
        var ast = lisb.parser.parse("(if (something o) a)"),
            cond = ast[0];

        test.deepEqual(cond, new lisb.COND([
                    new lisb.CLAUSE(
                        new lisb.CALL(
                            new lisb.ID('something'),
                            [new lisb.ID('o')]), 
                    new lisb.ID('a'))]));

        test.done();
    },

    "cond conditional expressions can be parsed": function(test) {
        var ast = lisb.parser.parse("(cond (false a))"),
            cond = ast[0];

        test.deepEqual(cond, new lisb.COND([new lisb.CLAUSE(new lisb.ID('false'), new lisb.ID('a'))]));

        test.done();
    },

    "cond conditional expressions can have several clauses": function(test) {
        var ast = lisb.parser.parse("(cond (false a) (true b))"),
            cond = ast[0];

        test.deepEqual(cond, new lisb.COND([
                    new lisb.CLAUSE(new lisb.ID('false'), new lisb.ID('a')),
                    new lisb.CLAUSE(new lisb.ID('true'), new lisb.ID('b'))
                ]));

        test.done();
    },

    "cond conditional expression with else clause": function(test) {
        var ast = lisb.parser.parse("(cond (false x) (else  y))"),
            cond = ast[0];

        test.deepEqual(cond, new lisb.COND([
                new lisb.CLAUSE(new lisb.ID('false'), new lisb.ID('x')), 
                new lisb.CLAUSE(true, new lisb.ID('y'))]));

        test.done();          
    },

    "cond conditional with only else clause": function(test) {
        var ast = lisb.parser.parse("(cond (else  y))"),
            cond = ast[0];

        test.deepEqual(cond, new lisb.COND([new lisb.CLAUSE(true,  new lisb.ID('y'))]));

        test.done();
    },

    "conditionals without consequent fails": function(test) {
        test.throws(function() {
            lisb.parser.parse("(if )");
        });

        test.throws(function() {
            lisb.parser.parse("(cond )");
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
        test.deepEqual(bool, true);

        ast = lisb.parser.parse("#f");
        bool = ast[0];
        test.deepEqual(bool, false);

        test.done();
    },

    "lambdas can be parsed": function(test) {
        var ast = lisb.parser.parse("(lambda () #t)"),
            lambda = ast[0];

        test.ok(lambda instanceof lisb.LAMBDA);
        test.deepEqual(lambda, new lisb.LAMBDA([], [ true ]));
        test.done();
    },

    "lambdas can contain definitions": function(test) {
        var ast = lisb.parser.parse("(lambda (a b c) (define (k) (- b 99)) a)"),
             lambdaBody = ast[0].body;

        test.deepEqual(lambdaBody[0],  new lisb.DEF('k', new lisb.LAMBDA([],[ 
                    new lisb.CALL(new lisb.ID('-'), [new lisb.ID('b'), 99 ])
                ])));
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

        test.deepEqual(letExpr, new lisb.CALL(new lisb.LAMBDA([ new lisb.ID('x')], [new lisb.CALL(new lisb.ID('+'),[new lisb.ID('x'),new lisb.ID('x')])]), [ 3 ]));
        
        test.done();
    },


    'set! can be parsed': function(test) {
        var ast = lisb.parser.parse("(set! a 2)"),
            set = ast[0];

        test.deepEqual(set, new lisb.SET("a", 2));

        test.done();
    },

    'set! must reference a identifier and end with expression':function(test) {
        test.throws(function() {
            lisb.parser.parse("(set!)");
        });

        test.throws(function() {
            lisb.parser.parse("(set! x )");
        });

        test.done();    
    },

    "define can't be redefined (yet?!)": function(test) {
        // TODO: Consider if "keywords" should be allowed to be redefined
        // (i.e. define, set!, lambda, let, cond, if, else).
        // This would simplify the parser and shift that logic to the evaluate/apply functions.
        // What are the pro's/con's? Is there a valid usecase for it?
        test.throws(function() {
            lisb.parser.parse("(let ((define (lambda (x) x))) (define 2))");
        });
        test.done();
    },

    "symbol expressions can be empty": function(test) {
        var ast = lisb.parser.parse("'()"),
            nil = ast[0];
        
        test.deepEqual(nil, lisb.NIL);

        test.done();
    },

    "symbol expressions can contain numbers": function(test) {
        var ast = lisb.parser.parse("'(999.999)"),
            pair = ast[0];

        test.deepEqual(pair, new lisb.PAIR(999.999, lisb.NIL));

        ast = lisb.parser.parse("'(1.0 -3.5 4)");
        pair = ast[0];

        test.deepEqual(pair, new lisb.PAIR(1.0, new lisb.PAIR(-3.5, new lisb.PAIR(4, lisb.NIL))));        

        test.done();
    },

    "symbol expressions can contain symbols and strings": function(test) {
        var ast = lisb.parser.parse("'(\"foo\" \"bar\")"),
            pair = ast[0];

        test.deepEqual(pair, new lisb.PAIR("foo", new lisb.PAIR("bar", lisb.NIL)));

        ast = lisb.parser.parse("'('biz 'baz)");
        pair = ast[0];

        test.deepEqual(pair, new lisb.PAIR(new lisb.SYMB("biz"), new lisb.PAIR(new lisb.SYMB("baz"), lisb.NIL)));

        test.done();
    },

    "symbol expressions can contain identifiers": function(test) {
        var ast = lisb.parser.parse("'(foo bar)"),
            pair = ast[0];

        test.deepEqual(pair, new lisb.PAIR(new lisb.ID("foo"), new lisb.PAIR(new lisb.ID("bar"), lisb.NIL)));

        test.done();
    },

    "symbol expressions can contain keywords": function(test) {

        var ast = lisb.parser.parse("'(define)"),
            def = ast[0];
        // TODO: The most elegant way to solve the above ought to be to change the parser
        // so that it has no keywords. This means more logic in the evaluator to determine the expression,
        // e.g. recognizing a parameter list.
        // Other ways to fix this would be to let symbol expressions contain the specified keywords
        // and just treat them differently here...
        test.deepEqual(def, new lisb.PAIR(new lisb.ID("define"), lisb.NIL));

        test.done();
    },




    // TODO: Add more tests for let?
    //  - symbol lists
    //  - "complex" sample program, e.g. fibonacci
});


}());




