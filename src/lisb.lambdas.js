
function is_lambda(statement, environment) {
    if (statement instanceof lisb.Pair) {
        var name = get_name(statement.head);
        return name === "lambda" && get_value_of_var(name, environment) === undefined;
    }
    return false;
}

function create_pure_lambda(statement, environment) {
    return create_lambda(statement.tail, environment);
}

function create_lambda(statement, environment, name) {
    var lambda_body = statement.tail;
    check_lambda_body_ends_with_expression(lambda_body, statement, environment);

    var lambda_environment = copy_environment(environment);
    var parameters = get_params(statement.head);
    return create_js_function(lambda_body, parameters, lambda_environment, name);
}

function check_lambda_body_ends_with_expression(lambda_body, statement, environment) {
    var last_body_statement = lambda_body;
    for(var p = last_body_statement; p !== lisb.NIL; p = p.tail) {
        last_body_statement = p.head;
    }
    
    // TODO: lambdas and definitions have cros dependencies... 
    // Is it an issue that should be resolved?
    if (is_def(last_body_statement, environment)) {
        throw new Error("No expression after a sequence of internal definitions in: " + statement_to_string(lambda_body));
    }
}

function get_params(param_list) {
    var params = [];
    for (var p = param_list; p !== lisb.NIL; p = p.tail) {
        params.push(p.head);
    }

    return params;
}

function create_frame(parameters, args) {
    var frame = {};

    for (var i = 0; i < parameters.length; i++) {
        frame[get_name(parameters[i])] = {value: args[i]};
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

function is_let(statement, environment) {
    if (statement instanceof lisb.Pair) {
        var name = get_name(statement.head);
        return name === "let" && get_value_of_var(name, environment) === undefined;
    }
    return false;
}

function call_let(statement, environment) {
    return evaluate_sexpr(rewrite_let_to_lambda_call(statement, environment), environment);
}

function rewrite_let_to_lambda_call(statement, environment) {
    var params_args = statement.tail.head;
    var let_body = statement.tail.tail;
    var params = [];
    var args = lisb.NIL;
    for (var p = params_args; p !== lisb.NIL; p = p.tail) {
        params.push(p.head.head);

        args = cons(p.head.tail.head, args);
    }
    var func = create_js_function(let_body, params, environment);
    return cons(func, args);
}

function create_js_function(statement_body, parameters, environment, name) {
    return function() {
        check_arguments(parameters, arguments, name);
        var frame = create_frame(parameters, arguments);

        environment.push(frame);
        
        var result = evaluate_body(statement_body, environment);

        environment.pop();

        return result;
    };
}

function check_arguments(parameters, args, name) {
    if (parameters.length !== args.length) {
        var str_args = "";
        for(var i = 0; i < args.length; i++) {
            str_args += args[i] + " ";
        }
        throw new Error((name !== undefined ? "Procedure " + name : "#<procedure>") + 
            ": expects " + parameters.length + " arguments, given " + 
            args.length + ( args.length > 0 ? ": " + str_args.substring(0, str_args.length - 1) : ""));
    }
}


function evaluate_body(body, environment) {
    var result = null;
    for (var p = body; p !== lisb.NIL;  p = p.tail) {
        result = evaluate_sexpr(p.head, environment);
    }
    return result;
}

init_lambdas_handler = function() {
    var lambdas_handler = {
        can_handle: is_lambda,
        handle: create_pure_lambda,
    };
    Object.freeze(lambdas_handler);
    lisb.register_handler(lambdas_handler);

    var let_handler = {
        can_handle: is_let,
        handle: call_let,
    };  
    Object.freeze(let_handler);
    lisb.register_handler(let_handler);
};