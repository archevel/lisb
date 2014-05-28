(function() {
"use strict";
var nodeunit = require('nodeunit');


global.lisb = {};

require('../src/lisb.variables.js');
require('../src/lisb.definitions.js');
require('../src/lisb.assignments.js');
require('../src/lisb.conditionals.js');
require('../src/lisb.lambdas.js');
require('../src/lisb.calls.js');

exports.initializer = nodeunit.testCase({
    "including initializer adds all handlers to lisb handlers": function(test) {
        require('../src/lisb.initializer.js');
        test.strictEqual(lisb.handlers.length, 8);
        test.done();
    },
});

}());
