// TODO: Fix the global variable so it works in both browser and node.
global.lisb = global.lisb || {};

(function () {
"use strict";

function statement_to_string(statement) {
    if (statement instanceof lisb.Pair) {
        var str_repr = "";
        for (var p = statement; p !== lisb.NIL; p = p instanceof lisb.Pair ? p.tail : lisb.NIL) {
            str_repr += statement_to_string(p.head) + " ";
        }
        str_repr = "(" + str_repr.substring(0, str_repr.length - 1) + ")";
        return str_repr;
    }
    if (statement instanceof lisb.Name) {
        return statement.name;
    }
    if (statement instanceof lisb.Symbol) {
        return "'" + statement_to_string(statement.value);
    }
    if (typeof statement === "string") {
        return '"' + statement +  '"';
    }
    if (typeof statement === "boolean") {
        return statement ? "#t" : "#f";
    }
    return statement.toString();
}

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
        // TODO: fix this to be a variadic function with three params:
        // a,b, others. a must be greater than b and all values in others.       
        // TODO: all args must be numbers. Should we check this and throw an exception?
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

function is_def(statement, environment) {
    if (statement instanceof lisb.Pair) {
        var name = get_name(statement.head);
        return name === "define" && get_value_of_var(name, environment) === undefined;
    }
    return false;
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

function is_lambda(statement, environment) {
    if (statement instanceof lisb.Pair) {
        var name = get_name(statement.head);
        return name === "lambda" && get_value_of_var(name, environment) === undefined;
    }
    return false;
}

function is_let(statement, environment) {
    if (statement instanceof lisb.Pair) {
        var name = get_name(statement.head);
        return name === "let" && get_value_of_var(name, environment) === undefined;
    }
    return false;
}

function is_if(statement, environment) {
    if (statement instanceof lisb.Pair) {
        var name = get_name(statement.head);
        return name === "if" && get_value_of_var(name, environment) === undefined;
    }
    return false;
}

function is_cond(statement, environment) {
    if (statement instanceof lisb.Pair) {
        var name = get_name(statement.head);
        return name === "cond" && get_value_of_var(name, environment) === undefined;
    }
    return false;
}

function is_assignment(statement, environment) {
    if (statement instanceof lisb.Pair) {
        var name = get_name(statement.head);
        return name === "set!" && get_value_of_var(name, environment) === undefined;
    }
    return false;
}

function get_name(id) {
    return id.name;
}

function get_value(valuable) {
    return valuable.value;
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
        evaluated_args.push(evaluate_sexpr(p.head, environment));
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

function check_variable_defintion(definition_args, statement) {
    if (definition_args === lisb.NIL || definition_args.tail !== lisb.NIL) {
        var missingOrMultiple = definition_args === lisb.NIL ? "(missing expression after identifier)" : "(multiple expressions after identifier)";
        throw new Error("Bad syntax " + missingOrMultiple  + " in: " + statement_to_string(statement));
    }
}

function define_variable (name, statement, environment ) {
    var definition_args = statement.tail.tail;
    check_variable_defintion(definition_args, statement);

    environment[environment.length - 1][get_name(name)] = { value: evaluate_sexpr(definition_args.head, environment) };
}
    
function check_function_definition(name, params, statement) {
    if (name === undefined) {
        throw new Error("Bad syntax at: " + statement_to_string(params) + " in: " + statement_to_string(statement));
    }
}

function define_function(params, statement, environment) {
    var name = get_name(params.head);
    check_function_definition(name, params, statement);

    var lambda_params = params.tail;
    var lambda_body = statement.tail.tail;

    var lambda = create_lambda(cons(lambda_params, lambda_body), environment, get_name(params.head));

    environment[environment.length - 1][name] = { value: lambda };
}

function define(statement, environment) {
    var params_or_name = statement.tail.head;
    if(params_or_name instanceof lisb.Name) {
        define_variable(params_or_name, statement, environment);
    } 
    else if(params_or_name instanceof lisb.Pair && statement.tail.tail !== lisb.NIL && params_or_name !== lisb.NIL) {
        define_function(params_or_name, statement, environment);
    } else {
        var missing_body_or_params = statement.tail.tail === lisb.NIL ? "(no expressions for procedure body)" : ("at: " + statement_to_string(params_or_name));
        throw new Error("Bad syntax " + missing_body_or_params + " in: " + statement_to_string(statement));
    }
}

function check_assignment_and_get_variable(statement, environment) {
    if (statement.tail === lisb.NIL) {
        throw new Error("Bad syntax (has 0 parts after keyword) in: " + statement_to_string(statement));
    }
    else if (statement.tail.tail === lisb.NIL) {
        throw new Error("Bad syntax (has 1 part after keyword) in: " + statement_to_string(statement));   
    }

    var variable = find_var(get_name(statement.tail.head), environment);
    if (get_value(variable) === undefined) {
        throw new Error("Can not set undefined variable: " + get_name(statement.tail.head));
    }

    return variable;
}

function assign_variable(statement, environment) {
    var variable = check_assignment_and_get_variable(statement, environment);

    variable.value = evaluate_sexpr(statement.tail.tail.head, environment);
}

function lookup_variable(statement, environment) {
    var value = get_value_of_var(get_name(statement), environment);
    if (value === undefined) {
        throw Error("Reference to undefined identifier: " + get_name(statement));
    }

    return value;
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

function get_func(statement, environment) {
    return get_value_of_var(get_name(statement.head), environment) || 
        predefinedFunctions[get_name(statement.head)] || 
        evaluate_sexpr(statement.head, environment);
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

function eval_cond(statement, environment) {
    for (var clause = statement.tail; clause !== lisb.NIL; clause = clause.tail) {
        if (get_name(clause.head.head) === "else" || evaluate_sexpr(clause.head.head, environment) !== false) {
            return evaluate_sexpr(clause.head.tail.head, environment);
        } 
    }
}

function check_if_expression(predicate_pair, consequent_pair,statement) {
    if (predicate_pair === lisb.NIL) {
        throw new Error("Bad syntax (has 0 parts after keyword) in: " + statement_to_string(statement));
    }
    else if (consequent_pair === lisb.NIL) {
        throw new Error("Bad syntax (has 1 part after keyword) in: " + statement_to_string(statement));   
    }
}

function rewrite_if_to_cond(statement, environment) {
    var predicate_pair = statement.tail,
        consequent_pair = (predicate_pair !== lisb.NIL ? predicate_pair.tail : lisb.NIL),
        else_consequent_pair = (consequent_pair !== lisb.NIL ? consequent_pair.tail : lisb.NIL); 

    check_if_expression(predicate_pair, consequent_pair, statement);

    return cons(new lisb.Name("cond"), 
            cons(cons(predicate_pair.head, cons(consequent_pair.head, lisb.NIL)),
            cons(cons(new lisb.Name("else"), cons(else_consequent_pair.head, lisb.NIL)), lisb.NIL)));

}

function copy_environment(environment) {
    var new_environment = [];
    for (var i = 0; i < environment.length; i++) {
        new_environment.push(environment[i]);
    }
    return new_environment;
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
        result = evaluate_sexpr(p.head, environment);
    }
    return result;
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

function check_lambda_body_ends_with_expression(lambda_body, statement, environment) {
    var last_body_statement = lambda_body;
    for(var p = last_body_statement; p !== lisb.NIL; p = p.tail) {
        last_body_statement = p.head;
    }
    
    if (is_def(last_body_statement, environment)) {
        throw new Error("No expression after a sequence of internal definitions in: " + statement_to_string(lambda_body));
    }
}

function create_lambda(statement, environment, name) {
    var lambda_body = statement.tail;
    check_lambda_body_ends_with_expression(lambda_body, statement, environment);

    var lambda_environment = copy_environment(environment);
    var parameters = get_params(statement.head);
    return create_js_function(lambda_body, parameters, lambda_environment, name);
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

// TODO: Refactor if-else blocks into separate functions that get registered
// with an evaluator. More lisb "handlers" can then be added dynamically.
function evaluate_sexpr(statement, environment) {
    if (is_name(statement)) {
        return lookup_variable(statement, environment);
    }
    else if(is_def(statement, environment)) {
        define(statement, environment);
    }
    else if (is_if(statement, environment)) {
        return eval_cond(rewrite_if_to_cond(statement, environment), environment);
    }
    else if (is_cond(statement, environment)) {
        return eval_cond(statement, environment);
    }
    else if (is_assignment(statement, environment)) {
        assign_variable(statement, environment);
    } 
    else if (is_lambda(statement, environment)) {
        return create_lambda(statement.tail, environment);
    }
    else if (is_let(statement, environment)) {
        return make_call(rewrite_let_to_lambda_call(statement, environment), environment);
    }
    else if (is_call(statement)) {
        return make_call(statement, environment); 
    }
    else { // Self evaluating expression...
        return statement;
    }
}

function parse_and_evaluate(statments) {

    var ast = lisb.parser.parse(statments),
        environment = [create_empty_frame()],
        result = null;

    for(var p = ast; p !== lisb.NIL; p = p.tail) {
        result = evaluate_sexpr(p.head, environment);
    }

    return result;
}

lisb.evaluate = parse_and_evaluate;


}());