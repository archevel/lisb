
function is_variable_lookup(statement, environment) { 
    return is_name(statement, environment); 
}

function lookup_variable(statement, environment) {
    var value = get_value_of_var(get_name(statement), environment);
    if (value === undefined) {
        throw Error("Reference to undefined identifier: " + get_name(statement));
    }

    return value;
}

init_variables_handler = function() {
    var handler = {
        can_handle: is_variable_lookup,
        handle: lookup_variable,
    };
    Object.freeze(handler);
    lisb.register_handler(handler);
};
