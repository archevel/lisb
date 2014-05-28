function is_assignment(statement, environment) {
    if (statement instanceof lisb.Pair) {
        var name = get_name(statement.head);
        return name === "set!" && get_value_of_var(name, environment) === undefined;
    }
    return false;
}


function assign_variable(statement, environment) {
    var variable = check_assignment_and_get_variable(statement, environment);

    variable.value = evaluate_sexpr(statement.tail.tail.head, environment);
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

init_assignments_handler = function() {
    var handler = {
        can_handle: is_assignment,
        handle: assign_variable,
    };
    Object.freeze(handler);
    lisb.register_handler(handler);
};