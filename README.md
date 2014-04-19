# LISB 

LISB stands for LISP InSide the Browser. It is a javascript implementation of a Lisp Evaluator. The aims of LISB are:

 - To enable evaluation of Lisb scripts loaded by script tags on webpages. 
 - Limited language features (symbols, strings, numbers, boolean literals, lambdas, let, function invokations, function/variable definitions)
 - Easy javascript interop. It should be simple to use e.g. jQuery from LISB code. It should also be simple to invoke a LISB function from JS code.

Future goals/ideas
 
 - Replace interpreter w/ Racket embedded as plugin to Firefox/Chrome.
 - Debugging using existing developer tools
 