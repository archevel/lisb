(function(g) {
"use strict";

lisb.Id = function(name) { this.name = name; };

lisb.String = String;

lisb.Number = Number;

lisb.Boolean = Boolean;

lisb.Symb = function(name) { this.name = name; };

lisb.Pair = function(head,tail) {
     this.head = head; 
     this.tail = tail; 
};
lisb.NIL = new lisb.Pair();

// = function(values) { this.values = values; };

lisb.Lambda = function(params, body) { this.params = params; this.body = body; };

lisb.Def = function(name, value) { this.name = name; this.value = value; };

lisb.Set = function(name, value) { this.name = name; this.value = value; };

lisb.Call = function(func, args) { this.func = func; this.args = args; };

lisb.Cond = function(clauses) { this.clauses = clauses; };

lisb.Clause = function(predicate, consequent) { this.predicate = predicate; this.consequent = consequent; };

}(this));


