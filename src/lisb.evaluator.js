global.lisb = global.lisb || {};

(function () {
"use strict";

lisb.evaluate = function(statments) {
    var ast = lisb.parser.parse(statments);
    var environment = {};
    for (var i = 0; i < ast.length; i++) {
        if(ast[i] instanceof lisb.DEF) {
            var def = ast[i]
            environment[def.name] = def.value;
        }
    }
    if (ast[ast.length - 1] instanceof lisb.ID) {
        var id = ast[ast.length - 1]
        return environment[id.name];
    }
    return ast[ast.length - 1];
};




}());;