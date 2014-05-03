(function(g) {
"use strict";

lisb.String = String;

lisb.Number = Number;

lisb.Boolean = Boolean;

lisb.Name = function(name) {
    this.name = name;
    Object.freeze(this);
};

lisb.Symbol = function(value) { 
    this.value = value; 
    Object.freeze(this);
};

lisb.Pair = function(head,tail) {
     this.head = head; 
     this.tail = tail; 
     if (tail !== undefined && tail.is_list) {
        this.is_list = true;
     }
     Object.freeze(this);
};

lisb.NIL = {
    is_list: true
};
Object.freeze(lisb.NIL);

// // = function(values) { this.values = values; };

// lisb.Lambda = function(params, body) { this.params = params; this.body = body; };

// lisb.Def = function(name, value) { this.name = name; this.value = value; };

// lisb.Set = function(name, value) { this.name = name; this.value = value; };

// lisb.Call = function(func, args) { this.func = func; this.args = args; };

// lisb.Cond = function(clauses) { this.clauses = clauses; };

// lisb.Clause = function(predicate, consequent) { this.predicate = predicate; this.consequent = consequent; };

}(this));


