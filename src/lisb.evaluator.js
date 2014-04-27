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

function find(id, environment) {
    for(var i = environment.length - 1; i >= 0; i--) {
        var variable = environment[i][id];
        if(variable) {
            return variable;
        }
    }
    return {value:undefined};
}

function get(id, environment) {
    var val = value(find(id, environment));
    if (val === undefined) {
        return global[id];
    }

    return val;
}

function define(statement, environment) {
    environment[environment.length - 1][name(statement)] = { value: evaluateStatement(value(statement), environment) };
}

function assign_variable(statement, environment) {
    var variable = find(name(statement), environment);
    if (value(variable) === undefined) {
        throw new LisbError("No definition found for: " + name(statement));
    }

    variable.value = evaluateStatement(value(statement), environment);
}

function lookup_variable(statement, environment) {
    var value = get(name(statement), environment);
    if (value === undefined) {
        throw Error("Identifier '" + name(statement) + "' is not bound to a value");
    }

    return value;
}

function create_empty_frame() {
    return {};
}

function create_frame(parameters, argmnts, environment) {
    var frame = create_empty_frame();

    for (var i = 0; i < parameters.length; i++) {
        frame[name(parameters[i])] = {value: evaluateStatement(argmnts[i], environment)};
    }

    return frame;
}

function copy_environment(environment) {
    var new_environment = [];
    for (var i = 0; i < environment.length; i++) {
        new_environment.push(environment[i]);
    }
    return new_environment;
}

function call_primitive_func(func, statement, environment) {
    var unevaluated_args = args(statement);
    var evaluated_args = [];
    
    for (var i = 0; i < unevaluated_args.length; i++) {
        evaluated_args.push(evaluateStatement(unevaluated_args[i], environment));
    }

    return func(evaluated_args);
}

function check_arguments (statement, parameters, argmnts) {
    if (parameters.length !== argmnts.length) {
        var funcName = name(statement.func) ? "Function '" + name(statement.func) + "'" : "Lambda function";
        throw new Error(funcName + " requires " + parameters.length + " arguments, " + argmnts.length + " found");
    }
}

function evaluate_body(func) {
    var function_body = body(func);
    var result = null;
    for (var i = 0; i < function_body.length; i++) {
        result = evaluateStatement(function_body[i], func.environment);
    }
    return result;
}

function call_composite_func(func, statement, environment) {
    var parameters = params(func);
    var argmnts = args(statement);

    check_arguments(statement, parameters, argmnts);

    var frame = create_frame(parameters, argmnts, environment);
    
    func.environment.push(frame);
    
    var result = evaluate_body(func);

    func.environment.pop();

    return result;
}

function get_func(statement, environment) {
    return get(name(statement.func), environment) || 
        predefinedFunctions[name(statement.func)] || 
        evaluateStatement(statement.func, environment);
}

function make_call(statement, environment) {
    var func = get_func(statement, environment);

    // TODO: Should call_primitive_func and call_composite_func
    // take the statement as an argument? 
    // call_composite_func need's the statement to extract the
    // name of the functions if there is an error in the arguments check.
    // If this was not the case 'statement' could be replaced by 'args(statement)'
    // which is what the statement is used for inside these funcions. hmmm...
    if (is_function(func)) {
        return call_primitive_func(func, statement, environment);
    } 
    else if (is_lambda(func)) {
        return call_composite_func(func, statement, environment);
    }
    else {
        // TODO: How to write test for this? It should never happen... 
        // Remove this and just assume that if 'is_function' is false
        // then it func is a lamda?
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
        environment = [create_empty_frame()],
        result = null;

    for(var i = 0; i < ast.length; i++) {
        result = evaluateStatement(ast[i], environment);
    }

    return result;
}

lisb.evaluate = parseAndEvaluate;


}());