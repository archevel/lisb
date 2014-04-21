global.lisb = global.lisb || {};

(function () {
"use strict";

function add(args) {
    var rez = 0;
    for(var i = 0; i < args.length; i++) {
        rez += args[i];
    }
    return rez;
}

function greaterThan(args) {
    // TODO: fix this to be a variadic function with three params:
    // a,b, others. a must be greater than b and all values in others.
    // TODO: all args must be numbers. Should we check this and throw an exception?
    return args[0] > args[1]; 
}

function lessThan(args) {
    return args[0] < args[1];
}


function evaluateStatement(statement, environment) {
    
    if(statement instanceof lisb.DEF) {
        environment[statement.name] = evaluateStatement(statement.value, environment);
    }
    else if (statement instanceof lisb.ID) {
        return environment[statement.name];
    }
    else if (statement instanceof lisb.CALL) {
        if (statement.func.name === ">") {
            return greaterThan(statement.args);
        } 
        else if (statement.func.name === "<") {
            return lessThan(statement.args);
        }
        else {
            return add(statement.args);
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