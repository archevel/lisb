(function() {
"use strict";
var nodeunit = require('nodeunit');


require('../src/lisb.variables.js');
require('../src/lisb.definitions.js');
require('../src/lisb.assignments.js');
require('../src/lisb.conditionals.js');
require('../src/lisb.lambdas.js');
require('../src/lisb.calls.js');

var init_funcs = [
    init_conditionals_handler, 
    init_variables_handler, 
    init_definitions_handler, 
    init_assignments_handler, 
    init_lambdas_handler,
    init_calls_handler,
];


exports.handlers = nodeunit.testCase({
    "should add an init-function in a concatenation friendly manner": function(test) {
        // The init_func will be defined as a 
        // var in the concatenated lisb script. 
        // In these tests the func is added to
        // the global scope instead.
        for(var i = 0; i < init_funcs.length; i++) {
            test.strictEqual(typeof init_funcs[i], "function");
        }
        test.done();
    },

    "calling init-function should register the handler with the lisb object": function(test) {
        global.lisb = {
            register_handler: function(handler) {
                this.handler = handler;
            }
        };
        for(var i = 0; i < init_funcs.length; i++) {
            init_funcs[i]();
            test.strictEqual(typeof lisb.handler.can_handle, "function");
            test.strictEqual(typeof lisb.handler.handle, "function");
        }
        test.done();
    },

    "handler is frozen": function(test) {
        for(var i = 0; i < init_funcs.length; i++) {
            init_funcs[i]();

            test.ok(Object.isFrozen(lisb.handler));
        }

        test.done();
    },

});


}());