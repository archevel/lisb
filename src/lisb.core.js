// TODO: Fix the global variable so it works in both browser and node.
global.lisb = global.lisb || {};

var init_conditionals_handler  = null;
var init_variables_handler  = null;
var init_definitions_handler  = null;
var init_assignments_handler  = null;
var init_lambdas_handler  = null;
var init_calls_handler = null;

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
    if (statement instanceof lisb.Quote) {
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

function is_name(statement) {
    return statement instanceof lisb.Name;
}

function get_name(id) {
    return id.name;
}

function get_value(valuable) {
    return valuable.value;
}

<<<<<<< HEAD
=======
function evaluate_args(statement, environment) {
    var evaluated_args = [];
    for (var p = statement.tail; p !== lisb.NIL; p = p.tail) {
        evaluated_args.push(evaluate_sexpr(p.head, environment));
    }
    return evaluated_args;
}

>>>>>>> 7de692b4a26aacb0608114e3e50594194dc65922
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

// TODO: Refactor if-else blocks into separate functions that get registered
// with an evaluator. More lisb "handlers" can then be added dynamically.
function evaluate_sexpr(statement, environment) {
    
    for (var i = 0; i < lisb.handlers.length; i++) {
        if (lisb.handlers[i].can_handle(statement, environment)) {
            return lisb.handlers[i].handle(statement, environment);
        }
    }
<<<<<<< HEAD

=======
    
>>>>>>> 7de692b4a26aacb0608114e3e50594194dc65922
    // Self evaluating expression...
    return statement;
    
}

function parse_and_evaluate(statments) {

    var ast = lisb.parser.parse(statments),
        environment = [{}],
        result = null;

    for(var p = ast; p !== lisb.NIL; p = p.tail) {
        result = evaluate_sexpr(p.head, environment);
    }

    return result;
}


lisb.evaluate = parse_and_evaluate;
