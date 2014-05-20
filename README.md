# LISB 
[![Build Status](http://img.shields.io/travis/archevel/lisb.svg)](http://travis-ci.org/archevel/lisb)

LISB stands for LISP InSide the Browser. It is a javascript implementation of a Lisp Evaluator. The aims of LISB are:

 - To enable evaluation of Lisb scripts loaded by script tags on webpages. 
 - Limited language features (symbols, strings, numbers, boolean literals, lambdas, let, function invokations, function/variable definitions)
 - Easy javascript interop. It should be simple to use e.g. jQuery from LISB code. It should also be simple to invoke a LISB function from JS code.
 - Scripts must explicitly export functions/variables. 

Future goals/ideas
 
 - Replace interpreter w/ Racket embedded as plugin to Firefox/Chrome.
 - Debugging using existing developer tools
 

## GETTING STARTED
In order to build and work with LISB you need to install [Node](https://github.com/joyent/node). Once that is setup, clone this repo and run:

```
$ npm install
```

The test suite should now run:

```
$ grunt
```
