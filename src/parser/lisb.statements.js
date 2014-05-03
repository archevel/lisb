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

lisb.NIL = new lisb.Pair();


}(this));


