function is_def(statement, environment) {
    if (statement instanceof lisb.Pair) {
        var name = get_name(statement.head);
        return name === "define" && get_value_of_var(name, environment) === undefined;
    }
    return false;
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

function define_variable(name, statement, environment ) {
    var definition_args = statement.tail.tail;
    check_variable_defintion(definition_args, statement);

    environment[environment.length - 1][get_name(name)] = { value: evaluate_sexpr(definition_args.head, environment) };
}

function check_variable_defintion(definition_args, statement) {
    if (definition_args === lisb.NIL || definition_args.tail !== lisb.NIL) {
        var missingOrMultiple = definition_args === lisb.NIL ? "(missing expression after identifier)" : "(multiple expressions after identifier)";
        throw new Error("Bad syntax " + missingOrMultiple  + " in: " + statement_to_string(statement));
    }
}

function define_function(params, statement, environment) {
    var name = get_name(params.head);
    check_function_definition(name, params, statement);

    var lambda_params = params.tail;
    var lambda_body = statement.tail.tail;
    // TODO: Figure out if dependency on create_lambda should be refactored...
    // Currently the source files for the different handlers are just
    // a way to separate the code a bit, they are not realy modules in and of themselves.
    // Should they be?
    var lambda = create_lambda(cons(lambda_params, lambda_body), environment, get_name(params.head));

    environment[environment.length - 1][name] = { value: lambda };
}

function check_function_definition(name, params, statement) {
    if (name === undefined) {
        throw new Error("Bad syntax at: " + statement_to_string(params) + " in: " + statement_to_string(statement));
    }
}

init_definitions_handler = function() {
    var handler = {
        can_handle: is_def,
        handle: define,
    };
    Object.freeze(handler);
    lisb.register_handler(handler);
};