(function() {
"use strict";
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
    "'a-symbol": new lisb.Symbol(new lisb.Name("a-symbol")),
    "#t": true,
    "#f": false
};
exports.evaluator = nodeunit.testCase({

    'evaluates simple expessions': function(test) {
        for (var input in simpleTestValues) {
            var actual = lisb.evaluate(input);

            test.deepEqual(actual, simpleTestValues[input]);
        }

        test.done();
    },

    "evaluates a definition to it's value": function(test) {

        var script = "(define x INPUT) x";


        for (var input in simpleTestValues) {
            var inputScript = script.replace('INPUT', input);
            var actual = lisb.evaluate(inputScript);

            test.deepEqual(actual, simpleTestValues[input]);
        }

        test.done();
    },
    "evaluates a definition to it's value in a script": function(test) {

        var script = '"some other script stuff" (define x INPUT) x';

        for (var input in simpleTestValues) {
            var inputScript = script.replace('INPUT', input);
            var actual = lisb.evaluate(inputScript);

            test.deepEqual(actual, simpleTestValues[input]);
        }

        test.done();
    },

    "evaluates to the correct result when there are several definitions": function(test) {

        var actual = lisb.evaluate("(define a 1) (define b 2) a");
        test.strictEqual(actual, 1);

        actual = lisb.evaluate("(define a 1) (define b 2) b");
        test.strictEqual(actual, 2);

        test.done();
    },

    "definitions have 'undefined' as their value": function(test) {
        var actual = lisb.evaluate("(define b 2)");
        test.strictEqual(actual, undefined);

        test.done();        
    },


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

    "variables can be used in definitions": function(test) {
        var script = "(define a INPUT) (define b a) b";
        for (var input in simpleTestValues) {
            var inputScript = script.replace('INPUT', input);
            var actual = lisb.evaluate(inputScript);

            test.deepEqual(actual, simpleTestValues[input]);
        }

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

    "evaluates calls to predefined functions": function(test) {
        var actual = lisb.evaluate('(> 3 1)');
        test.strictEqual(actual, true);

        actual = lisb.evaluate('(> 1 3)');
        test.strictEqual(actual, false);

        actual = lisb.evaluate('(> 67 67)');
        test.strictEqual(actual, false);

        actual = lisb.evaluate('(< 12 67)');
        test.strictEqual(actual, true);

        actual = lisb.evaluate('(< 67 3)');
        test.strictEqual(actual, false);

        actual = lisb.evaluate('(< 67 67)');
        test.strictEqual(actual, false);

        actual = lisb.evaluate('(+ 25 25)');
        test.strictEqual(actual, 50);

        actual = lisb.evaluate('(+ -12 25)');
        test.strictEqual(actual, 13);

        actual = lisb.evaluate('(+ 0.1 0.2)');
        test.notEqual(actual, 0.3);
        test.strictEqual(actual, 0.1 + 0.2); // Same arithmetic used as in js... 0.1 + 0.2 !== 0.3

        test.done();
    },

    "evaluates arguments to calls to predefined functions": function(test) {
        var actual = lisb.evaluate('(define a 3) (+ a 24.0)');
        test.strictEqual(actual, 27.0);

        test.done();
    },

    "defined functions can be called": function(test) {
        var actual = lisb.evaluate('(define (my-gt a b) (> a b)) (my-gt 2 4)');
        test.strictEqual(actual, false);

        actual = lisb.evaluate('(define (my-gt a b) (> a b)) (my-gt 1000 10)');
        test.strictEqual(actual, true);

        actual = lisb.evaluate('(define (my-add a b) (+ a b)) (my-add 9 10)');
        test.strictEqual(actual, 19);

        test.done();
    },

    "defined functions with multiple statments in body will execute all statements": function(test) {
        var actual = lisb.evaluate('(define (my-gt a b) (define z 99) (+ z a b)) (my-gt 2 4)');
        test.strictEqual(actual, 105);        

        test.done();
    },

    "local definitions shadows outer definitions": function(test) {
        var actual = lisb.evaluate('(define a-var "Upp trälar uti alla stater!") ((lambda () (define a-var 3) a-var))');

        test.strictEqual(actual, 3);
        test.done();
    },

    "outer definitions are not overwritten by local definitions in the outer scope": function(test) {
        var actual = lisb.evaluate('(define a-var "Som hungern bojor lagt uppå") ((lambda () (define a-var 3) a-var)) a-var');

        test.strictEqual(actual, "Som hungern bojor lagt uppå");
        test.done();
    },

    "lambda functions can be called": function(test) {
        var actual = lisb.evaluate('((lambda (a b) (> a b)) 3 4)');
        test.strictEqual(actual, false);

        actual = lisb.evaluate('((lambda (a b) (+ a b)) 7 14)');
        test.strictEqual(actual, 21);

        test.done();
    },
    "lambda functions works with different parameter names": function(test) {
        var actual = lisb.evaluate('((lambda (c d) (+ d c)) 7 14)');
        test.strictEqual(actual, 21);

        test.done();
    },

    "let expressions bind the params to their values": function(test) {
        var script = "(let ((a TEST_VAL)) a)";
        for (var testVal in simpleTestValues) {
            var actual = lisb.evaluate(script.replace("TEST_VAL", testVal));
            test.deepEqual(actual, simpleTestValues[testVal]);
        }


        test.done();
    },

    "recursive calls works": function(test) {
        var actual = lisb.evaluate('(define (recurse-curse a) (if (< a 5) (recurse-curse (+ a 1)) a)) (recurse-curse 0)');
        test.strictEqual(actual, 5);

        test.done();
    },
    
    "a functions can be passed as values and evaluated":function(test) {
        var actual = lisb.evaluate('(define (give-func) (lambda (y) (+ y y))) ((give-func) 20)');

        test.strictEqual(actual, 40);
        test.done();
    },

    "a function can use the variables available in the scope it was defined":function(test) {
        var actual = lisb.evaluate('(define (give-func x) (lambda (y) (+ x y))) ((give-func 2) 20)');

        test.strictEqual(actual, 22);
        test.done();
    },

    "when a parameter shadows another variable the value is restored after a call": function(test) {
        var actual = lisb.evaluate("(define (foo x) ((lambda (x) (+ x 1)) 3) x) (foo 1)");

        test.strictEqual(actual, 1);
        test.done();
    },

    "when a variable is shared between two functions they can both affect it":function(test) {
        var actual = lisb.evaluate("(define (x) (set! foo 20) 10 ) (define (y) foo) (define foo 12) (x) (y)");

        test.strictEqual(actual, 20);
        test.done();
    },

    
    "if variable is not found in environment, the javascript global scope should be checked": function(test) {
        global.Foo = 9000;

        var actual = lisb.evaluate("Foo");

        test.strictEqual(actual, 9000);
        
        delete global.Foo;
        test.done();
    },


    

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
        test.deepEqual(actual, new lisb.Symbol(new lisb.Name('some_val')));

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

    "javascript functions can be called":function(test) {
        global.myFunc = function() { return 3; };
        var actual = lisb.evaluate("(myFunc)");

        test.strictEqual(actual, 3);

        test.strictEqual(lisb.evaluate('(eval "1 + 2")'), 3); // Tihi! :)

        test.done();
    },

    "vanilla js can call a function defined in LISB":function(test) {

        var lambda = lisb.evaluate("(define x 100) (lambda (y) (+ x y) )");
        test.strictEqual(lambda(1), 101);
        test.strictEqual(lambda(2), 102);
        test.strictEqual(lambda(100.2), 200.2);

        test.done();
    },

    "keywords can be redefined": function(test) {
        
        var keywords = ['define', 'set!', 'lambda', 'let', 'cond', 'if', 'else'];
        for (var i = 0; i < keywords.length; i++) {
            var kw = keywords[i];
            var actual = lisb.evaluate("(let ((" + kw + " (lambda (x) x))) (" + kw + " 2))");
            test.strictEqual(actual, 2);
            actual = lisb.evaluate("(define (" + kw + " x) x) (" + kw + " 2)");
            test.strictEqual(actual, 2);
        }
        
        test.done();
    },

    /*************************
     *  INVALID EXPRESSIONS  *
     *************************/
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

    "an error occurs if value not found for parameter": function (test) {
        test.throws(function() {
            lisb.evaluate('(define (x y z) 5) (x 99)');
        }, function(e) {
            return e instanceof Error && e.message === "Procedure x: expects 2 arguments, given 1: 99"; 
        });

        test.throws(function() {
            lisb.evaluate('(define (x y z) 5) (x)');
        }, function(e) {return e instanceof Error && e.message === "Procedure x: expects 2 arguments, given 0"; });

        test.throws(function() {
            lisb.evaluate('(define (somenameyname y z) 5) (somenameyname)');
        }, function(e) {return e instanceof Error && e.message === "Procedure somenameyname: expects 2 arguments, given 0"; });

        test.throws(function() {
            lisb.evaluate('((lambda (y z) 5) 9 8 7)');
        }, function(e) {
            return e instanceof Error && e.message === "#<procedure>: expects 2 arguments, given 3: 9 8 7"; 
        });
        test.done();
    },

    "unbound identifiers yield an error when evaluated": function(test) {
        test.throws(function() {
            lisb.evaluate('x');
        }, function(e) {
            return e instanceof Error && e.message === "Reference to undefined identifier: x"; 
        });
        test.throws(function() {
            lisb.evaluate('aina');
        }, function(e) {
            return e instanceof Error && e.message === "Reference to undefined identifier: aina"; 
        });
        test.done();
    },
    
    "local definitions do not leak to outer scope": function(test) {
        test.throws(function() {
            lisb.evaluate('(define (z) (define x 3) 5) (z) x');
        }, function(e) {
            return e instanceof Error && e.message === "Reference to undefined identifier: x"; 
        });
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

    "variable definitions must have right amount of arguments": function(test) {
        test.throws(function() {
            lisb.evaluate("(define x)");
        }, function(e) {
            return e.message === "Bad syntax (missing expression after identifier) in: (define x)";
        });
        
        test.throws(function() {
            lisb.evaluate("(define x 1 2)");
        }, function(e) {
            return e.message === "Bad syntax (multiple expressions after identifier) in: (define x 1 2)";
        });
        
        test.done();
    },

    "variable definitions must have a name": function(test) {
        test.throws(function() {
            lisb.evaluate("(define 'x 1)");
        }, function(e) {
            return e instanceof Error && e.message ===  "Bad syntax at: 'x in: (define 'x 1)"; 
        });
        
        test.throws(function() {
            lisb.evaluate('(define "x" 1)');
        }, function(e) {
            return e instanceof Error && e.message === 'Bad syntax at: "x" in: (define "x" 1)'; 
        });
        
        test.throws(function() {
            lisb.evaluate("(define '(brainz) 1)");
        }, function(e) {
            return e instanceof Error && e.message ===  "Bad syntax at: '(brainz) in: (define '(brainz) 1)"; 
        });

        test.done();
    },

    "function definitions must have right amount of arguments": function(test) {

        test.throws(function() {
            lisb.evaluate("(define (x))");
        }, function(e) {
            return e instanceof Error && e.message === "Bad syntax (no expressions for procedure body) in: (define (x))";
        });

        test.throws(function() {
            lisb.evaluate("(define () 1)");
        }, function(e) {
            return e instanceof Error && e.message === "Bad syntax at: () in: (define () 1)";
        });
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

    "defines are not ok in conditionals": function(test) {   
        // TODO: Find out if these are interpreted as function invocations
        test.throws(function() {
            lisb.evaluate("(if 'truthyvalue ((define x 4) x))"); 
        }, function(e) {
            return e instanceof Error && e.message === "Statement '((define x 4) x)' was called, but is not currently defined";
        });
        test.throws(function() {
            lisb.evaluate('(cond ("truthyvalue" ((define x "4") x)))');
        }, function(e) {
            return e instanceof Error && e.message === "Statement '((define x \"4\") x)' was called, but is not currently defined";
        });
           
        test.throws(function() {
            lisb.evaluate('(if ((define x 99) x) "value")');
        }, function(e) {
            return e instanceof Error && e.message === "Statement '((define x 99) x)' was called, but is not currently defined";
        });
        test.throws(function() {
            lisb.evaluate("(cond (((define x #t) x) 'truthyvalue ))");
        }, function(e) {
            return e instanceof Error && e.message === "Statement '((define x #t) x)' was called, but is not currently defined";
        });

        test.done();
    },

    'function call or literals not allowed as identifier in function definition': function(test) {
        test.throws(function() {
            lisb.evaluate("(define ((fun a) b c d) a)");
        }, function(e) {
            return e instanceof Error && e.message === "Bad syntax at: ((fun a) b c d) in: (define ((fun a) b c d) a)";
        });
        test.throws(function() {
            lisb.evaluate("(define (4 b c d) a)");
        }, function(e) {
            return e instanceof Error && e.message === "Bad syntax at: (4 b c d) in: (define (4 b c d) a)";
        });
        test.done();
    },

    'variable definitions can not use literals as identifiers': function(test) {
        test.throws(function() {
            lisb.evaluate("(define 4 #t)");
        });
        test.throws(function() {
            lisb.evaluate('(define "four" 99)');
        });
        test.throws(function() {
            lisb.evaluate("(define 'symb 13)");
        });
        test.throws(function() {
            lisb.evaluate("(define #f 13)");
        });
        test.done();
    },

    'function body can not end with definition': function(test) {
        test.throws(function() {
            lisb.evaluate("(define (f a) (define d 10))");
        }, function(e) {
            return e instanceof Error && e.message === "No expression after a sequence of internal definitions in: ((define d 10))";
        }); 

        test.throws(function() {
            lisb.evaluate("(define (f a) (define d 10) (define (x b) (+ a (* b d))))");
        }, function(e) {
            return e instanceof Error && e.message === "No expression after a sequence of internal definitions in: ((define d 10) (define (x b) (+ a (* b d))))";
        }); 

        test.done();
    },


    "lambdas body can't end with definition": function(test) {
        test.throws(function(){
            lisb.evaluate("(lambda (x) (define z x))");
        }, function(e) {
            return e instanceof Error && e.message === "No expression after a sequence of internal definitions in: ((define z x))";
        });

        test.throws(function(){
            lisb.evaluate("(lambda (x) (define identityFunc (x) x))");
        }, function(e) {
            return e instanceof Error && e.message === "No expression after a sequence of internal definitions in: ((define identityFunc (x) x))";
        });

        test.done();
    },
    'set! must reference a identifier and end with expression':function(test) {
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

    // TODO: Add line numbers and column to error messages
    // TODO: Add begin expression 
});


}());