// TODO: Fix the global variable so it works in both browser and node.
global.lisb = global.lisb || {};

(function () {
"use strict";

var predefinedFunctions = {
    '+': function(args) {
        // TODO: fix same as > function
        var rez = 0;
        for(var i = 0; i < args.length; i++) {
            rez += args[i];
        }
        return rez;
    },
    '>': function(args) {
        // TODO: fix this to be a variadic function with three params:
        // a,b, others. a must be greater than b and all values in others.
        // TODO: all args must be numbers. Should we check this and throw an exception?
        return args[0] > args[1]; 
    },
    '<': function(args) {
        // TODO: fix same as > function
        return args[0] < args[1];
    },
};


function evaluateStatement(statement, environment) {
    
    if(statement instanceof lisb.DEF) {
        environment[statement.name] = evaluateStatement(statement.value, environment);
    }
    else if (statement instanceof lisb.ID) {
        return environment[statement.name];
    }
    else if (statement instanceof lisb.CALL) {
        var func = predefinedFunctions[statement.func.name];
        if (func instanceof Function) {
            var args = [];
            for (var a = 0; a < statement.args.length; a++) {
                args.push(evaluateStatement(statement.args[a], environment));
            }
            return func(args);
        } 
        else if (statement.func instanceof lisb.LAMBDA) {
            console.log("Args: ", statement.args);
            console.log("body: ", statement.func.body);
            console.log("body[0]: ", statement.func.body[0]);
            environment.a = statement.args[0];
            environment.b = statement.args[1];
            return evaluateStatement(statement.func.body[0], environment);
        } 
        else {
            return predefinedFunctions['>'](statement.args);
        }
    }
    else if (statement instanceof lisb.COND) {
        for (var i = 0; i < statement.clauses.length; i++) {
            var clause = statement.clauses[i];
            if(evaluateStatement(clause.predicate, environment) !== false) {
                return evaluateStatement(clause.consequent, environment);
            }
        }
    }
    else if(statement instanceof lisb.SET) {
        if (environment[statement.name] === undefined) {
            throw new LisbError("No definition found for: " + statement.name);
        }

        environment[statement.name] = evaluateStatement(statement.value, environment);
    } 
    else { // Self evaluating expression...
        return statement;
    }
}

function parseAndEvaluate(statments) {
    
    var ast = lisb.parser.parse(statments),
        environment = {},
        result = null;

    for(var i = 0; i < ast.length; i++) {
        result = evaluateStatement(ast[i], environment);
    }

    return result;
}

lisb.evaluate = parseAndEvaluate;


}());