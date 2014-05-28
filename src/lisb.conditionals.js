

function is_cond(statement, environment) {
    if (statement instanceof lisb.Pair) {
        var name = get_name(statement.head);
        return name === "cond" && get_value_of_var(name, environment) === undefined;
    }
    return false;
}

function eval_cond(statement, environment) {
    for (var clause = statement.tail; clause !== lisb.NIL; clause = clause.tail) {
        if (get_name(clause.head.head) === "else" || evaluate_sexpr(clause.head.head, environment) !== false) {
            return evaluate_sexpr(clause.head.tail.head, environment);
        } 
    }
}

function is_if(statement, environment) {
    if (statement instanceof lisb.Pair) {
        var name = get_name(statement.head);
        return name === "if" && get_value_of_var(name, environment) === undefined;
    }
    return false;
}

function eval_if(statement, environment) {
    return eval_cond(rewrite_if_to_cond(statement, environment), environment);
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


init_conditionals_handler = function() {
    var cond_handler = {
        can_handle: is_cond,
        handle: eval_cond,
    };
    Object.freeze(cond_handler);
    lisb.register_handler(cond_handler);

    var if_handler = {
        can_handle: is_if,
        handle: eval_if,
    };
    Object.freeze(if_handler);
    lisb.register_handler(if_handler);
};
