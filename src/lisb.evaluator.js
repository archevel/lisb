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

function is_def(statement) {
    return statement instanceof lisb.DEF;
}

function is_id(statement) {
    return statement instanceof lisb.ID;
}

function is_call(statement) {
    return statement instanceof lisb.CALL;
}

function is_function(statement) {
    return statement instanceof Function;
}

function is_lambda(statement) {
    return statement instanceof lisb.LAMBDA;
}

function is_cond(statement) {
    return statement instanceof lisb.COND;
}

function is_assignment(statement) {
    return statement instanceof lisb.SET;
}

function name(id) {
    return id.name;
}

function value(valuable) {
    return valuable.value;
}

function body(func) {
    return func.body[0];
}

function params(func) {
    return func.params;
}

function args(call) {
    return call.args;
}

function define(statement, environment) {
    environment[name(statement)] = evaluateStatement(value(statement), environment);
}

function lookup_variable(statement, environment) {
    return environment[name(statement)];
}

function make_call(statement, environment) {
    var func = environment[name(statement.func)] || predefinedFunctions[name(statement.func)] || statement.func;

    if (is_function(func)) {
        var unevaluated_args = args(statement);
        var argmnts = [];
        
        for (var a = 0; a < unevaluated_args.length; a++) {
            argmnts.push(evaluateStatement(unevaluated_args[a], environment));
        }

        return func(argmnts);
    } 
    else if (is_lambda(func)) {
        var parameters = params(func);
        var argmnts2 = args(statement);
        for (var p = 0; p < parameters.length; p++) {
            environment[name(parameters[p])] = evaluateStatement(argmnts2[p], environment);
        }
        return evaluateStatement(body(func), environment);
    }
}

function eval_cond(statement, environment) {
    for (var i = 0; i < statement.clauses.length; i++) {
        var clause = statement.clauses[i];
        if(evaluateStatement(clause.predicate, environment) !== false) {
            return evaluateStatement(clause.consequent, environment);
        }
    }
}

function assign_variable(statement, environment) {
    if (environment[name(statement)] === undefined) {
        throw new LisbError("No definition found for: " + name(statement));
    }

    environment[name(statement)] = evaluateStatement(value(statement), environment);
}

// TODO: Refactor if-else blocks into separate functions that get registered
// with an evaluator. More lisb "handlers" can then be added dynamically.
function evaluateStatement(statement, environment) {
    
    if(is_def(statement)) {
        define(statement, environment);
    }
    else if (is_id(statement)) {
        return lookup_variable(statement, environment);
    }
    else if (is_call(statement)) {
        return make_call(statement, environment); 
    }
    else if (is_cond(statement)) {
        return eval_cond(statement, environment);
    }
    else if(is_assignment(statement)) {
        assign_variable(statement, environment);
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