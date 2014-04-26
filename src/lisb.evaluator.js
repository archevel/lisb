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
    return func.body;
}

function params(func) {
    return func.params;
}

function args(call) {
    return call.args;
}

function get(id, environment) {
    for(var i = environment.length - 1; i >= 0; i--) {
        var variable = environment[i][id];
        if(variable) {
            return value(variable);
        }
    }
    return undefined;
}

function set(id, val, environment) {
    var variable_undefined = true;
    for(var i = environment.length - 1; i >= 0 && variable_undefined; i--) {
        var variable = environment[i][id];
        if(variable) {
            variable.value = val;
            variable_undefined = false;
        }
    }
    environment[environment.length - 1][id] = { value: val };
}

function define(statement, environment) {
    environment[environment.length - 1][name(statement)] = { value: evaluateStatement(value(statement), environment) };
}

function lookup_variable(statement, environment) {
    var value = get(name(statement), environment);
    if (value === undefined) {
        throw Error("Identifier '" + name(statement) + "' is not bound to a value");
    }

    return value;
}

function create_frame() {
    return {};
}

function copy_environment(environment) {
    var new_environment = [];
    for (var i = 0; i < environment.length; i++) {
        new_environment.push(environment[i]);
    }
    return new_environment;
}

function make_call(statement, environment) {
    var func = get(name(statement.func), environment) || 
        predefinedFunctions[name(statement.func)] || 
        evaluateStatement(statement.func, environment);

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

        if (parameters.length !== argmnts2.length) {
            var funcName = name(statement.func) ? "Function '" + name(statement.func) + "'" : "Lambda function";
            throw new Error(funcName + " requires " + parameters.length + " arguments, " + argmnts2.length + " found");
        }

        var frame = create_frame();
        for (var p = 0; p < parameters.length; p++) {
            frame[name(parameters[p])] = {value: evaluateStatement(argmnts2[p], environment)};
        }
        
        func.environment.push(frame);
        var function_body = body(func);
        var result = null;
        for (var b = 0; b < function_body.length; b++) {
            result = evaluateStatement(function_body[b], func.environment);
        }

        func.environment.pop();

        return result;
    }
    else {
        // TODO: How to write test for this? It should never happen...
        throw new Error("Statement '" + statement + "' was called, but is neither a predefined functions or currently defined");
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
    if (get(name(statement), environment) === undefined) {
        throw new LisbError("No definition found for: " + name(statement));
    }

    set(name(statement), evaluateStatement(value(statement), environment), environment);
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
    else if (is_assignment(statement)) {
        assign_variable(statement, environment);
    } 
    else if (is_lambda(statement)) {
        statement.environment = copy_environment(environment);
        
        return statement;
    }
    else { // Self evaluating expression...
        return statement;
    }
}

function parseAndEvaluate(statments) {

    var ast = lisb.parser.parse(statments),
        environment = [create_frame()],
        result = null;

    for(var i = 0; i < ast.length; i++) {
        result = evaluateStatement(ast[i], environment);
    }

    return result;
}

lisb.evaluate = parseAndEvaluate;


}());