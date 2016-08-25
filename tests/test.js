"use strict";
var tsg = require('../lib');
var path = require('path');
var fs = require('fs');
var testModuleNames = [
    'fs',
    'path',
    'lodash',
    'jquery',
    'react'
];
var selfRefExpr = {
    a: 32,
    b: 'ok',
    self: null
};
selfRefExpr.self = selfRefExpr;
var expressions = {
    'Math': Math,
    'selfref': selfRefExpr,
    'builtIns': { d: new Date(3), arr: ['x'] },
    'someArray': [1, 'foo', Math, null, undefined, false],
    'badNames': { "*": 10, "default": true, "with": 10, "  ": 3 }
};
function checkDeclarationBaseline(name, content) {
    var filename = path.join(__dirname, "../../baselines/" + name);
    var existing = fs.existsSync(filename) ? fs.readFileSync(filename, 'utf-8') : '<none>';
    if (existing !== content) {
        fs.writeFile(filename, content, 'utf-8');
        throw new Error("Baseline " + name + " changed");
    }
}
describe("Module tests", function () {
    var _loop_1 = function(moduleName) {
        it("Generates the same declaration for " + moduleName, function () {
            var result = tsg.generateModuleDeclarationFile(moduleName, require(moduleName));
            checkDeclarationBaseline("module-" + moduleName + ".d.ts", result);
        });
    };
    for (var _i = 0, testModuleNames_1 = testModuleNames; _i < testModuleNames_1.length; _i++) {
        var moduleName = testModuleNames_1[_i];
        _loop_1(moduleName);
    }
});
describe("Expression tests", function () {
    var _loop_2 = function(key) {
        it("Generates the same declaration for " + key, function () {
            var result = tsg.generateIdentifierDeclarationFile(key, expressions[key]);
            checkDeclarationBaseline("expr-" + key + ".d.ts", result);
        });
    };
    for (var _i = 0, _a = Object.keys(expressions); _i < _a.length; _i++) {
        var key = _a[_i];
        _loop_2(key);
    }
});
