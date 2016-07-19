"use strict";
function guess(obj) {
    return Object.keys(obj).map(function (key) { return guessDeclaration(key, obj[key]); }).map(function (arr) { return arr.join('\r\n'); }).join('\r\n\r\n');
}
exports.guess = guess;
function guessDeclaration(name, obj) {
    if (typeof obj === 'function') {
        return [("declare function " + name + "(): any;")];
    }
    else if (typeof obj === 'object') {
        return [("declare const " + name + ": any;")];
    }
    else if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
        return [("declare const " + name + ": " + typeof obj + ";")];
    }
    else if (typeof obj === 'null') {
        return [("Property " + name + " was 'null'"), ("declare const " + name + ": any;")];
    }
    else {
        return [("Property " + name + " of type '" + typeof obj + "'"), ("declare const " + name + ": any;")];
    }
}
