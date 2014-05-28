

lisb.handlers = [];
function register_handler(handler) {
    lisb.handlers.push(handler);
}


lisb.register_handler = register_handler;

init_variables_handler();
init_definitions_handler();
init_assignments_handler();
init_conditionals_handler();
init_lambdas_handler();
init_calls_handler();
