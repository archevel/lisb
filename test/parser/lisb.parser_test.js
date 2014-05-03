
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
    'parse yields a frozen Pair':function(test) {
        var ast = lisb.parser.parse("0");

        test.ok(ast instanceof lisb.Pair);
        test.ok(Object.isFrozen(ast));
        test.done();
    },
    'simple integer value': function(test) {
        var ast = lisb.parser.parse("5"),
            num = ast.head;
        test.strictEqual(typeof num, 'number' );
        test.strictEqual(num,  5);
        test.done();
    },
    'parse yields a list': function(test) {
        var ast = lisb.parser.parse("-32");

        test.deepEqual(ast, new lisb.Pair(-32, lisb.NIL));
        test.ok(ast.is_list);
        test.done();
    },
   'negative integer value': function(test) {
        var ast = lisb.parser.parse("-5"),
            num = ast.head;
        test.strictEqual(typeof num, 'number' );
        test.strictEqual(num, -5);
        test.done();
    },
    'simple float value': function(test) {
        var ast = lisb.parser.parse("6.001"),
            num = ast.head;
        test.strictEqual(typeof num, 'number' );
        test.strictEqual(num,  6.001);
        test.done();
    },
    'negative float value': function(test) {
        var ast = lisb.parser.parse("-23456.789"),
            num = ast.head;
        test.strictEqual(typeof num, 'number' );
        test.strictEqual(num, -23456.789);
        test.done();
    },

    'simple identifier': function(test) {
        var ast = lisb.parser.parse("a"),
            identifier = ast.head;
        test.ok(identifier instanceof lisb.Name);
        test.strictEqual(identifier.name, 'a');
        test.done();
    },

    'identifier are frozen': function(test) {
        var ast = lisb.parser.parse("z"),
            identifier = ast.head;
        
        test.ok(Object.isFrozen(identifier));
        test.done();
    },

    'allow different identifiers': function(test) {
        for (var i = 0; i < complex_names.length; i++) {
            var ast = lisb.parser.parse(complex_names[i]),
                identifier = ast.head;
            test.ok(identifier instanceof lisb.Name);
            test.strictEqual(identifier.name, complex_names[i]);
        }

        test.done();
    },

    'identifiers can be more complex ': function(test) {
        var long_combined_name = complex_names.join(""),
            ast = lisb.parser.parse(long_combined_name),
            identifier = ast.head;

        test.ok(identifier instanceof lisb.Name);
        test.strictEqual(identifier.name, long_combined_name);

        test.done();
    },

    'several values are parsed as an sexpr': function(test) {
        var ast = lisb.parser.parse("-99.7 2 -100 7.4"),
            expectedValues = [-99.7, 2,-100, 7.4];
        var i = 0;
        for(var p = ast; p !== lisb.NIL; p = p.tail) {
            var num = p.head;
            test.strictEqual(typeof num, 'number' );
            test.strictEqual(num, expectedValues[i]);
            i += 1;
        }
        test.done();
    }, 

    'none of (, ), \', ", #, can be used as identifiers': function(test) {
        var disallowed = ["(", ")", "'", '"', "#"];
        var parse = function(script) {
            return function() { lisb.parser.parse(script); };
        };

        for(var i = 0; i < disallowed.length; i++) {            
            test.throws(parse(disallowed[i]), disallowed[i] + " did not throw exception.");
        }

        test.done();
    },

    'scripts can contain sub lists': function(test) {
        var ast = lisb.parser.parse("(x)"),
            sublist = ast.head;

        test.ok(sublist.is_list);
        test.deepEqual(sublist.head, new lisb.Name("x"));

        test.done();
    },


    'function definitions can be parsed': function(test) {
        var ast = lisb.parser.parse("(define (foo z) 2)"),
            def = ast.head,
            name_params = def.tail.head,
            body = def.tail.tail.head;

        test.deepEqual(def.head, new lisb.Name("define"));
        test.deepEqual(name_params, new lisb.Pair(new lisb.Name("foo"), new lisb.Pair(new lisb.Name("z"), lisb.NIL)));
        test.strictEqual(body, 2);
        test.done();
    },

    /*
    'define variable fails if no value provided': function(test) {
        test.throws(function() {
            lisb.parser.parse("(define x)");
        });
        test.done();
    },
    'define function': function(test) {
        var ast = lisb.parser.parse("(define (x a) a)"),
            def = ast[0];
        test.ok(def instanceof lisb.Def);
        test.strictEqual(def.name, 'x');
        test.deepEqual(def.value, new lisb.Lambda([new lisb.Symbol('a')], [new lisb.Symbol('a')]));
        test.done();
    },
    'define multi-argument function': function(test) {
        var ast = lisb.parser.parse("(define (fun a b c d) a)"),
            def = ast[0];
        test.ok(def instanceof lisb.Def);
        test.strictEqual(def.name, 'fun');
        test.deepEqual(def.value.params, [new lisb.Symbol('a'), new lisb.Symbol('b'), new lisb.Symbol('c'), new lisb.Symbol('d')]);
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

        test.ok(body[0] instanceof lisb.Call);
        test.deepEqual(body[0].func, new lisb.Symbol('+'));
        test.deepEqual(body[0].args, [new lisb.Symbol('a'), new lisb.Symbol('b'), new lisb.Symbol('c'), new lisb.Symbol('d'), 10 ]);

        test.done();

    },
    'function body can contain several nested definitions': function(test) {
        var ast = lisb.parser.parse("(define (f a) (define d 10) (define (x b) (+ a  (* b d))) (x a))"),
            body = ast[0].value.body;

        test.strictEqual(body.length, 3);
        test.deepEqual(body[0], new lisb.Def('d', 10));

        test.done();
    },

    'function body must end with expression': function(test) {
        
        test.throws(function() {
            lisb.parser.parse("(define (f a) (define d 10) (define (x b) (+ a  (* b d))) )");
        }); 

        test.done();
    },
*/
    'strings are valid values': function(test) {
        var strings = [
                    {input:'""', output:''}, 
                    {input: '"Heelo"', output:"Heelo"},
                    {input: '"This \\"should\\" also work"', output:'This "should" also work'},
                    {input: '"This \\nshould\\n also work"', output:"This \nshould\n also work"}
                    ];
        for (var i = 0; i < strings.length; i++) {
            var ast = lisb.parser.parse(strings[i].input);
            test.deepEqual(ast.head, strings[i].output );
        }
        test.done();
    },
 
    "consecutive strings are distinct expressions":function(test) {
        var ast = lisb.parser.parse('"hello" "world"');

        test.strictEqual(ast.head, "hello");
        test.strictEqual(ast.tail.head, "world");

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
            test.ok(ast.head instanceof lisb.Symbol);
            test.deepEqual(ast.head, new lisb.Symbol(new lisb.Name(validSymbols[i].output)) );
        }
        test.done();  
    },

    'invalid symbols throws parse error': function(test) {
        test.throws(function() {
            lisb.parser.parse("'");
        });
        test.done();
    },

    /* TODO: literal symbols need to be handled in the evaluator *//*
    'numeric "symbols" should be treated as numbers': function(test) {
        var numbersInSymbols = [
                    {input:"'2.01", output:2.01}, 
                    {input: "'2", output:2},
                    {input: "'-3", output:-3},
                    {input: "'-0.0000001", output:-0.0000001},
                    ];
        
        for (var i = 0; i < numbersInSymbols.length; i++) {

            var ast = lisb.parser.parse(numbersInSymbols[i].input);
            
            test.deepEqual(ast.head, numbersInSymbols[i].output);
        }
        test.done();  
    },
    'string "symbols" should be treated as strings': function(test) {
        var stringsInSymbols = [
                    {input:'\'"foo"', output:'foo'}, 
                    {input:'\'"larbor bark mood"', output:'larbor bark mood'},
                    {input:'\'"123.123"', output:'123.123'},
                    {input:'\'"-0.1"', output:'-0.1'},
                    ];
        
        for (var i = 0; i < stringsInSymbols.length; i++) {
            var ast = lisb.parser.parse(stringsInSymbols[i].input);
            
            test.deepEqual(ast.head, stringsInSymbols[i].output);
        }
        test.done();  
    },
    */
    '";" starts a comment that makes parser ignore the rest of the line': function(test) {
        var ast = lisb.parser.parse(";(define foos ball)");

        test.strictEqual(ast, lisb.NIL);

        ast = lisb.parser.parse("(define foos ball); hello");

        test.strictEqual(ast.tail, lisb.NIL);

        ast = lisb.parser.parse("(+ ;comment \n a b c)");

        test.deepEqual(ast.head.tail.head, new lisb.Name("a"));

        test.done();
    },

    /*

    "if conditional expressions can be parsed": function(test) {        
        var ast = lisb.parser.parse("(if true a)"),
            cond = ast[0];

        test.deepEqual(cond, new lisb.Cond([
                    new lisb.Clause(new lisb.Symbol('true'), new lisb.Symbol('a'))
                ]));

        test.done();
    },

    "if conditional expression with else consequent": function(test) {
        var ast = lisb.parser.parse("(if false a b)"),
            cond = ast[0];

        test.deepEqual(cond, new lisb.Cond([ 
                new lisb.Clause(new lisb.Symbol('false'), new lisb.Symbol('a')),
                new lisb.Clause(true, new lisb.Symbol('b'))]));

        test.done();          
    },

    "if conditional expressions function calls are valid predicates": function(test) {        
        var ast = lisb.parser.parse("(if (something o) a)"),
            cond = ast[0];

        test.deepEqual(cond, new lisb.Cond([
                    new lisb.Clause(
                        new lisb.Call(
                            new lisb.Symbol('something'),
                            [new lisb.Symbol('o')]), 
                    new lisb.Symbol('a'))]));

        test.done();
    },

    "cond conditional expressions can be parsed": function(test) {
        var ast = lisb.parser.parse("(cond (false a))"),
            cond = ast[0];

        test.deepEqual(cond, new lisb.Cond([new lisb.Clause(new lisb.Symbol('false'), new lisb.Symbol('a'))]));

        test.done();
    },

    "cond conditional expressions can have several clauses": function(test) {
        var ast = lisb.parser.parse("(cond (false a) (true b))"),
            cond = ast[0];

        test.deepEqual(cond, new lisb.Cond([
                    new lisb.Clause(new lisb.Symbol('false'), new lisb.Symbol('a')),
                    new lisb.Clause(new lisb.Symbol('true'), new lisb.Symbol('b'))
                ]));

        test.done();
    },

    "cond conditional expression with else clause": function(test) {
        var ast = lisb.parser.parse("(cond (false x) (else  y))"),
            cond = ast[0];

        test.deepEqual(cond, new lisb.Cond([
                new lisb.Clause(new lisb.Symbol('false'), new lisb.Symbol('x')), 
                new lisb.Clause(true, new lisb.Symbol('y'))]));

        test.done();          
    },

    "cond conditional with only else clause": function(test) {
        var ast = lisb.parser.parse("(cond (else  y))"),
            cond = ast[0];

        test.deepEqual(cond, new lisb.Cond([new lisb.Clause(true,  new lisb.Symbol('y'))]));

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
*/
    "truth literals #t and #f are valid values": function(test) {
        var ast = lisb.parser.parse("#t"),
            bool = ast.head;
        test.deepEqual(bool, true);

        ast = lisb.parser.parse("#f");
        bool = ast.head;
        test.deepEqual(bool, false);

        test.done();
    },
  /* TODO: literal symbols need to be handled in the evaluator *//*
    'truth literal "symbols" should be treated as truth literals': function(test) {
        var ast = lisb.parser.parse("'#t"),
            bool = ast.head;
        test.deepEqual(bool, true);

        ast = lisb.parser.parse("'#f");
        bool = ast.head;
        test.deepEqual(bool, false);

        test.done();
    },
 */

/*
    "lambdas can be parsed": function(test) {
        var ast = lisb.parser.parse("(lambda () #t)"),
            lambda = ast[0];

        test.ok(lambda instanceof lisb.Lambda);
        test.deepEqual(lambda, new lisb.Lambda([], [ true ]));
        test.done();
    },

    "lambdas can contain definitions": function(test) {
        var ast = lisb.parser.parse("(lambda (a b c) (define (k) (- b 99)) a)"),
             lambdaBody = ast[0].body;

        test.deepEqual(lambdaBody[0],  new lisb.Def('k', new lisb.Lambda([],[ 
                    new lisb.Call(new lisb.Symbol('-'), [new lisb.Symbol('b'), 99 ])
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

        test.deepEqual(letExpr, new lisb.Call(new lisb.Lambda([ new lisb.Symbol('x')], [new lisb.Call(new lisb.Symbol('+'),[new lisb.Symbol('x'),new lisb.Symbol('x')])]), [ 3 ]));
        
        test.done();
    },


    'set! can be parsed': function(test) {
        var ast = lisb.parser.parse("(set! a 2)"),
            set = ast[0];

        test.deepEqual(set, new lisb.Set("a", 2));

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
*/
    "symbol expressions can be empty": function(test) {
        var ast = lisb.parser.parse("'()"),
            nil = ast.head;
        
        test.deepEqual(nil, new lisb.Symbol(lisb.NIL));

        test.done();
    },
    "symbol expressions can contain numbers": function(test) {
        var ast = lisb.parser.parse("'(999.999)"),
            sexpr = ast.head;

        test.deepEqual(sexpr, new lisb.Symbol(new lisb.Pair(999.999, lisb.NIL)));

        ast = lisb.parser.parse("'(1.0 -3.5 4)");
        sexpr = ast.head;

        test.deepEqual(sexpr, new lisb.Symbol(new lisb.Pair(1.0, new lisb.Pair(-3.5, new lisb.Pair(4, lisb.NIL)))));        

        test.done();
    },

    "symbol expressions can contain symbols and strings": function(test) {
        var ast = lisb.parser.parse("'(\"foo\" \"bar\")"),
            sexpr = ast.head;

        test.deepEqual(sexpr, new lisb.Symbol(new lisb.Pair("foo", new lisb.Pair("bar", lisb.NIL))));

        ast = lisb.parser.parse("'('biz 'baz)");
        sexpr = ast.head;

        test.deepEqual(sexpr, new lisb.Symbol(new lisb.Pair(new lisb.Symbol(new lisb.Name("biz")), 
            new lisb.Pair(new lisb.Symbol(new lisb.Name("baz")), lisb.NIL))));

        test.done();
    },

    "symbol expressions can contain identifiers": function(test) {
        var ast = lisb.parser.parse("'(a-long-name-can-be-kind-of-too-long-sometimes shorty-short-short)"),
            sexpr = ast.head;

        test.deepEqual(sexpr, new lisb.Symbol(new lisb.Pair(new lisb.Name("a-long-name-can-be-kind-of-too-long-sometimes"), 
            new lisb.Pair(new lisb.Name("shorty-short-short"), lisb.NIL))));

        test.done();
    },

    "symbol expressions can contain keywords": function(test) {
        var keywords = ["define", "if", 'else', 'cond', 'let', 'lambda', 'set!'];
        for (var i = 0; i < keywords.length; i++) {
            var ast = lisb.parser.parse("'(KW)".replace("KW", keywords[i])),
                keyword = ast.head;
            test.deepEqual(keyword, new lisb.Symbol(new lisb.Pair(new lisb.Name(keywords[i]), lisb.NIL)));
        }
        test.done();
    },

    "symbol expressions can contain symbols, strings and booleans": function(test) {
        var ast = lisb.parser.parse("'('foo \"bar\" #t)"),
            sexpr = ast.head;

        test.deepEqual(sexpr, new lisb.Symbol(new lisb.Pair(new lisb.Symbol(new lisb.Name("foo")), 
            new lisb.Pair("bar", new lisb.Pair(true, lisb.NIL)))));
        test.done();
    },

    'symbol literals can "stacked"':function(test) {
        var ast = lisb.parser.parse("''arga-leken-börjar-nu"),
            symb = ast.head;

        test.deepEqual(symb, new lisb.Symbol(new lisb.Symbol(new lisb.Name("arga-leken-börjar-nu"))));


        ast = lisb.parser.parse("''\"vilken-färg?\"");
        symb = ast.head;

        test.deepEqual(symb, new lisb.Symbol(new lisb.Symbol("vilken-färg?")));

        test.done();
    },
/*
    */


    // TODO: Add more tests for let?
    //  - symbol lists
    //  - "complex" sample program, e.g. fibonacci
});


}());




