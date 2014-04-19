(function(g) {
"use strict";

lisb.ID = function(name) { this.name = name; };

lisb.STRING = String;

lisb.NUMBER = Number;

lisb.BOOLEAN = Boolean;

lisb.SYMB = function(name) { this.name = name; };

lisb.LAMBDA = function(params, body) { this.params = params; this.body = body; };

lisb.DEF = function(name, value) { this.name = name; this.value = value; };

lisb.SET = function(name, value) { this.name = name; this.value = value; };

lisb.CALL = function(func, args) { this.func = func; this.args = args; };

lisb.COND = function(clauses, elseConsequent) { this.clauses = clauses;  this.elseConsequent = elseConsequent; };

lisb.CLAUSE = function(predicate, consequent) { this.predicate = predicate; this.consequent = consequent; };

}(this));


