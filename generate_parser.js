var fs = require('fs'),
    jison = require('jison');

fs.readFile('src/parser/lisb.jison', function(err, data) {
    if (err) {
        console.log("No grammar file found");
    }

    var parser = new jison.Parser(String(data));
    var parserSource = parser.generateModule({moduleName: "lisb.parser"});
    fs.writeFile('src/parser/lisb.parser.js', parserSource, function(err) {
        if (err) {            
            console.log("Error writing file: ", err);
        }
    });
});
