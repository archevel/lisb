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
        // TODO: all evaluate_args must be numbers. Should we check this and throw an exception?
        return a > b; 
    },
    '<': function(a, b) {
        // TODO: fix same as > function
        return a < b;
    },
    'cons': cons,
};

function cons(h,t) {
    return new lisb.Pair(h,t);
}

function is_def(statement) {
    return statement instanceof lisb.Pair && get_name(statement.head) === "define";
}

function is_name(statement) {
    return statement instanceof lisb.Name;
}

function is_call(statement) {
    return statement instanceof lisb.Pair;
}

function is_function(statement) {
    return statement instanceof Function;
}

function is_lambda(statement) {
    return statement instanceof lisb.Pair && get_name(statement.head) === "lambda";
}

function is_let(statement) {
    return statement instanceof lisb.Pair && get_name(statement.head) === "let";
}

function is_if(statement) {
    return statement instanceof lisb.Pair && get_name(statement.head) === "if";
}

function is_cond(statement) {
    return statement instanceof lisb.Pair && get_name(statement.head) === "cond";
}

function is_assignment(statement) {
    return statement instanceof lisb.Pair && get_name(statement.head) === "set!";
}

function is_symbol(statement) {
    return statement instanceof lisb.Symbol;
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

function get_params(param_list) {
    var params = [];
    for (var p = param_list; p !== lisb.NIL; p = p.tail) {
        params.push(p.head);
    }

    return params;
}

function evaluate_args(statement, environment) {
    var evaluated_args = [];
    for (var p = statement.tail; p !== lisb.NIL; p = p.tail) {
        evaluated_args.push(evaluateStatement(p.head, environment));
    }
    return evaluated_args;
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
    var params_or_name = statement.tail.head;
    if(params_or_name instanceof lisb.Name) {
        var value_pair = statement.tail.tail;
        if (value_pair !== lisb.NIL && value_pair.tail === lisb.NIL) {
            environment[environment.length - 1][get_name(params_or_name)] = { value: evaluateStatement(value_pair.head, environment) };
        } 
        else {
            throw new Error("Definition of '" + get_name(params_or_name) + "' has an incorrect number of arguments.");
        }
    } 
    else if(statement.tail.tail !== lisb.NIL) {
        var lambda_params = params_or_name.tail;
        var lambda_body = statement.tail.tail;
        var lambda = create_lambda(new lisb.Pair(lambda_params, lambda_body), environment);

        environment[environment.length - 1][get_name(params_or_name.head)] = { value: lambda };  
    } else {
        throw new Error("Function definition is malformed.");
    }
}

function assign_variable(statement, environment) {
    var variable = find_var(get_name(statement.tail.head), environment);
    if (get_value(variable) === undefined) {
        throw new Error("No definition found for: " + get_name(statement));
    }

    variable.value = evaluateStatement(statement.tail.tail.head, environment);
}

function lookup_variable(statement, environment) {
    var value = get_value_of_var(get_name(statement), environment);
    if (value === undefined) {
        throw Error("Identifier '" + get_name(statement) + "' is not bound to a value");
    }

    return value;
}

function call_func(func, statement, environment) {

    var evaluated_args = evaluate_args(statement, environment);

    return func.apply(func, evaluated_args);
}


function check_object_arguments(args, environment) {
    if (args.length < 1 || args.length > 2) {
        throw new Error("javascript objects only takes 1 or 2 arguments and " + args.length + " arguments was given.");
    }

    return evaluateStatement(args[0], environment);
}

function call_to_object(obj, statement, environment) {
    var args = evaluate_args(statement, environment);

    var key = check_object_arguments(args, environment);

    if (args.length === 1) {
        return obj[key];
    }

    var value = evaluateStatement(args[1], environment);
    obj[key] = value;
    return value;
}

function get_func(statement, environment) {
    return get_value_of_var(get_name(statement.head), environment) || 
        predefinedFunctions[get_name(statement.head)] || 
        evaluateStatement(statement.head, environment);
}

function make_call(statement, environment) {
    var func = get_func(statement, environment);

    // TODO: Should call_func and call_to_object
    // take the statement as an argument? 
    if (is_function(func)) {
        return call_func(func, statement, environment);
    }
    else if (func instanceof Object) {
        return call_to_object(func, statement, environment);
    }
    else {
        // TODO: How to write test for this? It should never happen... 
        // Remove this and just assume that if all if-else-if's are false 
        // then func is an Object?
        throw new Error("Statement '" + statement + "' was called, but is neither a predefined functions or currently defined");
    }
}

function eval_cond(statement, environment) {
    for (var clause = statement.tail; clause !== lisb.NIL; clause = clause.tail) {
        if (get_name(clause.head.head) === "else" || evaluateStatement(clause.head.head, environment) !== false) {
            return evaluateStatement(clause.head.tail.head, environment);
        } 
    }
}

function rewrite_to_cond(statement, environment) {
    var predicate = statement.tail.head,
        consequent = statement.tail.tail.head,
        else_consequent = statement.tail.tail.tail.head;

    return cons(new lisb.Name("cond"), 
            cons(cons(predicate, cons(consequent, lisb.NIL)),
            cons(cons(new lisb.Name("else"), cons(else_consequent, lisb.NIL)), lisb.NIL)), lisb.NIL);

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

function evaluate_body(body, environment) {
    var result = null;
    for (var p = body; p !== lisb.NIL;  p = p.tail) {
        result = evaluateStatement(p.head, environment);
    }
    return result;
}

function create_js_function(statement_body, parameters, environment) {
    return function() {
        check_arguments(parameters, arguments);

        var frame = create_frame(parameters, arguments);

        environment.push(frame);
        
        var result = evaluate_body(statement_body, environment);

        environment.pop();

        return result;
    };
}

function create_lambda(statement, environment) {
    var lambda_environment = copy_environment(environment);
    var parameters = get_params(statement.head);
    return create_js_function(statement.tail, parameters, lambda_environment);
}

function rewrite_to_lambda_call(statement, environment) {
    var params_args = statement.tail.head;
    var let_body = statement.tail.tail;
    var params = [];
    var args = lisb.NIL;
    for (var p = params_args; p !== lisb.NIL; p = p.tail) {
        params.push(p.head.head);

        args = new lisb.Pair(p.head.tail.head, args);
    }
    var func = create_js_function(let_body, params, environment);
    return new lisb.Pair(func, args);
}

// TODO: Refactor if-else blocks into separate functions that get registered
// with an evaluator. More lisb "handlers" can then be added dynamically.
function evaluateStatement(statement, environment) {
    
    if (is_name(statement)) {
        return lookup_variable(statement, environment);
    }
    else if(is_def(statement)) {
        define(statement, environment);
    }
    else if (is_if(statement)) {
        return eval_cond(rewrite_to_cond(statement, environment), environment);
    }
    else if (is_cond(statement)) {
        return eval_cond(statement, environment);
    }
    else if (is_assignment(statement)) {
        assign_variable(statement, environment);
    } 
    else if (is_lambda(statement)) {
        return create_lambda(statement.tail, environment);
    }
    else if (is_let(statement)) {
        return make_call(rewrite_to_lambda_call(statement, environment), environment);
    }
    else if (is_call(statement)) {
        return make_call(statement, environment); 
    }
    else { // Self evaluating expression...
        return statement;
    }
}

function parseAndEvaluate(statments) {

    var ast = lisb.parser.parse(statments),
        environment = [create_empty_frame()],
        result = null;

    for(var p = ast; p !== lisb.NIL; p = p.tail) {
        result = evaluateStatement(p.head, environment);
    }

    return result;
}

lisb.evaluate = parseAndEvaluate;


}());