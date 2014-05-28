function is_call(statement) {
    return statement instanceof lisb.Pair;
}

function make_call(statement, environment) {
    var func = get_func(statement, environment);

    if (is_function(func)) {
        return call_func(func, statement, environment);
    }
    else if (func instanceof Object) {
        return call_to_object(func, statement, environment);
    }
    else {
        throw new Error("Statement '" + statement_to_string(statement) + "' was called, but is not currently defined");
    }
}

function get_func(statement, environment) {
    return get_value_of_var(get_name(statement.head), environment) || 
        predefinedFunctions[get_name(statement.head)] || 
        evaluate_sexpr(statement.head, environment);
}

function is_function(statement) {
    return statement instanceof Function;
}

function call_func(func, statement, environment) {
    var evaluated_args = evaluate_args(statement, environment);

    return func.apply(func, evaluated_args);
}


function check_object_arguments(args, environment) {
    if (args.length < 1 || args.length > 2) {
        throw new Error("Javascript objects only takes 1 or 2 arguments and " + args.length + " arguments was given.");
    }

    return evaluate_sexpr(args[0], environment);
}

function call_to_object(obj, statement, environment) {
    var args = evaluate_args(statement, environment);

    var key = check_object_arguments(args, environment);

    if (args.length === 1) {
        return obj[key];
    }

    var value = evaluate_sexpr(args[1], environment);
    obj[key] = value;
    return value;
}

init_calls_handler = function() {
    var handler = {
        can_handle: is_call,
        handle: make_call,
    };
    Object.freeze(handler);
    lisb.register_handler(handler);
};