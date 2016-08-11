import * as tsg from '../lib';
import * as path from 'path';
import * as fs from 'fs';

const testModuleNames = [
	'fs',
	'path',
	'lodash',
	'jquery',
	'react'
];

const selfRefExpr = {
	a: 32,
	b: 'ok',
	self: <any>null
}
selfRefExpr.self = selfRefExpr;

const expressions: { [s: string]: any } = {
	'Math': Math,
	'selfref': selfRefExpr,
	'someArray': [ 1, 'foo', Math, null, undefined, false ]
};

function checkDeclarationBaseline(name: string, content: string) {
	const filename = path.join(__dirname, `../../baselines/${name}`);
	const existing = fs.existsSync(filename) ? fs.readFileSync(filename, 'utf-8') : '<none>';
	if (existing !== content) {
		fs.writeFile(filename, content, 'utf-8');
		throw new Error(`Baseline ${name} changed`);
	}
}

describe("Module tests", () => {
	for(const moduleName of testModuleNames) {
		it(`Generates the same declaration for ${moduleName}`, () => {
			const result = tsg.generateModuleDeclarationFile(moduleName!, require(moduleName!));
			checkDeclarationBaseline(`module-${moduleName}.d.ts`, result);
		});
	}
});

describe("Expression tests", () => {
	for(const key of Object.keys(expressions)) {
		it(`Generates the same declaration for ${key}`, () => {
			const result = tsg.generateIdentifierDeclarationFile(key!, expressions[key!]);
			checkDeclarationBaseline(`expr-${key}.d.ts`, result);
		});
	}
});