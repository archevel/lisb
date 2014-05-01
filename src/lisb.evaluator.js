// TODO: Fix the global variable so it works in both browser and node.
global.lisb = global.lisb || {};

(function () {
"use strict";

var predefinedFunctions = {
    '+': function() {
        // TODO: fix same as > function
        var rez = 0;
        for(var i = 0; i < arguments.length; i++) {
            rez += arguments[i];
        }
        return rez;
    },
    '>': function(a, b) {
        // TODO: fix this to be a variadic function with three get_params:
        // a,b, others. a must be greater than b and all values in others.
        // TODO: all get_args must be numbers. Should we check this and throw an exception?
        return a > b; 
    },
    '<': function(a, b) {
        // TODO: fix same as > function
        return a < b;
    },
};

function is_def(statement) {
    return statement instanceof lisb.Def;
}

function is_id(statement) {
    return statement instanceof lisb.Id;
}

function is_call(statement) {
    return statement instanceof lisb.Call;
}

function is_function(statement) {
    return statement instanceof Function;
}

function is_lambda(statement) {
    return statement instanceof lisb.Lambda;
}

function is_cond(statement) {
    return statement instanceof lisb.Cond;
}

function is_assignment(statement) {
    return statement instanceof lisb.Set;
}

function is_symbol(statement) {
    return statement instanceof lisb.Symb;
}

function get_name(id) {
    return id.name;
}

function get_value(valuable) {
    return valuable.value;
}

function get_body(func) {
    return func.body;
}

function get_params(func) {
    return func.params;
}

function get_args(call) {
    return call.args;
}

function find_var(id, environment) {
    for(var i = environment.length - 1; i >= 0; i--) {
        var variable = environment[i][id];
        if(variable) {
            return variable;
        }
    }
    return {value:undefined};
}

function get_value_of_var(id, environment) {
    var val = get_value(find_var(id, environment));
    if (val === undefined) {
        return global[id];
    }

    return val;
}

function define(statement, environment) {
    environment[environment.length - 1][get_name(statement)] = { value: evaluateStatement(get_value(statement), environment) };
}

function assign_variable(statement, environment) {
    var variable = find_var(get_name(statement), environment);
    if (get_value(variable) === undefined) {
        throw new LisbError("No definition found for: " + get_name(statement));
    }

    variable.value = evaluateStatement(get_value(statement), environment);
}

function lookup_variable(statement, environment) {
    var value = get_value_of_var(get_name(statement), environment);
    if (value === undefined) {
        throw Error("Identifier '" + get_name(statement) + "' is not bound to a value");
    }

    return value;
}

function call_func(func, statement, environment) {

    var args = get_args(statement);
    var evaluated_args = [];

    for (var i = 0; i < args.length; i++) {
        evaluated_args.push(evaluateStatement(args[i], environment));
    }


    return func.apply(func, evaluated_args);
}


function check_object_arguments(args, environment) {
    if (args.length < 1 || args.length > 2) {
        throw new Error("javascript objects only takes 1 or 2 arguments and " + args.length + " arguments was given.");
    }

    var key = evaluateStatement(args[0], environment);

    if (is_symbol(key)) {
        key = get_name(key);
    }
    else if (typeof key !== "string") {
        throw new Error("Only strings and symbols can be used as keys to access javascript object values");
    }

    return key;
}

function call_to_object(obj, statement, environment) {
    var args = get_args(statement);

    var key = check_object_arguments(args, environment);

    if (args.length === 1) {
        return obj[key];
    }

    var value = evaluateStatement(args[1], environment);
    obj[key] = value;
    return value;
}

function get_func(statement, environment) {
    return get_value_of_var(get_name(statement.func), environment) || 
        predefinedFunctions[get_name(statement.func)] || 
        evaluateStatement(statement.func, environment);
}

function make_call(statement, environment) {
    var func = get_func(statement, environment);

    // TODO: Should call_primitive_func and call_func
    // take the statement as an argument? 
    // call_func need's the statement to extract the
    // name of the functions if there is an error in the arguments check.
    // If this was not the case 'statement' could be replaced by 'get_args(statement)'
    // which is what the statement is used for inside these funcions. hmmm...

    if (is_function(func)) {
        return call_func(func, statement, environment);
    }
    else if (func instanceof Object) {
        return call_to_object(func, statement, environment);
    }
    else {
        // TODO: How to write test for this? It should never happen... 
        // Remove this and just assume that if all if-else-if's are false 
        // then it func is an Object?
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

function copy_environment(environment) {
    var new_environment = [];
    for (var i = 0; i < environment.length; i++) {
        new_environment.push(environment[i]);
    }
    return new_environment;
}

function check_arguments(parameters, args) {
    if (parameters.length !== args.length) {
        throw new Error("Function requires " + parameters.length + " arguments, " + args.length + " found");
    }
}

function create_empty_frame() {
    return {};
}

function create_frame(parameters, args) {
    var frame = create_empty_frame();

    for (var i = 0; i < parameters.length; i++) {
        frame[get_name(parameters[i])] = {value: args[i]};
    }

    return frame;
}

function evaluate_body(func, environment) {
    var function_body = get_body(func);
    var result = null;
    for (var i = 0; i < function_body.length; i++) {
        result = evaluateStatement(function_body[i], environment);
    }
    return result;
}

function create_lambda(statement, environment) {
    var lambda_environment = copy_environment(environment);
    return function() {
        var parameters = get_params(statement);

        check_arguments(parameters, arguments);

        var frame = create_frame(parameters, arguments);

        lambda_environment.push(frame);
        
        var result = evaluate_body(statement, lambda_environment);

        lambda_environment.pop();

        return result;
    };
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
        return create_lambda(statement, environment);
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