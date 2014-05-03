
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

    '";" starts a comment that makes parser ignore the rest of the line': function(test) {
        var ast = lisb.parser.parse(";(define foos ball)");

        test.strictEqual(ast, lisb.NIL);

        ast = lisb.parser.parse("(define foos ball); hello");

        test.strictEqual(ast.tail, lisb.NIL);

        ast = lisb.parser.parse("(+ ;comment \n a b c)");

        test.deepEqual(ast.head.tail.head, new lisb.Name("a"));

        test.done();
    },

    "truth literals #t and #f are valid values": function(test) {
        var ast = lisb.parser.parse("#t"),
            bool = ast.head;
        test.deepEqual(bool, true);

        ast = lisb.parser.parse("#f");
        bool = ast.head;
        test.deepEqual(bool, false);

        test.done();
    },

    'scripts can contain sub lists': function(test) {
        var ast = lisb.parser.parse("(x)"),
            sublist = ast.head;

        test.deepEqual(sublist.head, new lisb.Name("x"));

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
});


}());




