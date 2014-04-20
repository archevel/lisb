global.lisb = global.lisb || {};

(function () {
"use strict";

function add(args) {
    var rez = 0;
    for(var i = 0; i < args.length; i++) {
        rez += args[i];
    }
    return rez;
}

function evaluate(ast, environment) {
    console.log(ast);
    for (var i = 0; i < ast.length; i++) {
        var statement = ast[i];
        if(statement instanceof lisb.DEF) {
            environment[statement.name] = evaluate([statement.value], environment);
        }
        if(statement instanceof lisb.SET) {
            if (environment[statement.name] === undefined) {
                throw new LisbError("No definition found for: " + statement.name);
            }

            environment[statement.name] = evaluate([statement.value], environment);
        }
    }
    if (ast[ast.length - 1] instanceof lisb.ID) {
        var id = ast[ast.length - 1];
        return environment[id.name];
    }


    return ast[ast.length - 1];
}

function parseAndEvaluate (statments) {
    console.log("evaluating...")
    var ast = lisb.parser.parse(statments),
        res = evaluate(ast, {});
    console.log("done evaluating...");
    return res;
}

lisb.evaluate = parseAndEvaluate


}());