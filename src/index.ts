import * as ts from 'typescript';
import * as _ from 'underscore';

export function guess(obj: any): string {
	let keys: string[] = [];
	let chain = obj;
	do {
		keys = keys.concat(Object.getOwnPropertyNames(chain))
		chain = Object.getPrototypeOf(chain);
	} while (chain !== null && chain !== Object.prototype && chain !== Function.prototype);
	keys = _.unique(keys).filter(s => isVisitableName(s));

	const declarations = keys.map(key => guessDeclaration(key, obj[key]));
	declarations.sort(declarationComparer);

	return declarations.map(decl => decl.lines.join('\r\n')).join('\r\n');
}

function isVisitableName(s: string) {
	return ["caller", "arguments"].indexOf(s) < 0;
}

interface Declaration {
	name: string;
	kind: "function" | "class" | "variable";
	lines: string[];
}

function guessDeclaration(name: string, obj: any): Declaration {
	if (typeof obj === 'function') {
		const parsedFunction = parseFunctionBody(obj);
		const info = getParameterListAndReturnType(obj, parsedFunction);
		if ((obj.prototype === undefined) ||
			(Object.keys(obj.prototype).length === 0)) {
			return {
				name,
				lines: [`declare function ${name}(${info[0]}): ${info[1]};`],
				kind: "function"
			}
		} else {
			const classBody: string[] = [`constructor(${info[0]});`];
			classBody.push(...getClassPrototypeMembers(obj));
			classBody.push(...getClassInstanceMembers(obj));
			const lines = [`declare class ${name} {`].concat(classBody.map(s => '    ' + s)).concat(`}`);
			return {
				name,
				lines,
				kind: "class"
			}
		}
	} else if (typeof obj === 'object') {
		return { name, kind: "variable", lines: [`declare const ${name}: any;`] }
	} else if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
		return { name, kind: "variable", lines: [`declare const ${name}: ${typeof obj};`] }
	} else if (typeof obj === 'null' || typeof obj === 'undefined') {
		return { name, kind: "variable", lines: [`// Property ${name} was '${typeof obj}'`, `declare const ${name}: any;`] }
	} else {
		return { name, kind: "variable", lines: [`// Property ${name} was of unrecognized type '${typeof obj}'`, `declare const ${name}: any;`] }
	}
}

function getClassPrototypeMembers(ctor: any): string[] {
	const names = Object.getOwnPropertyNames(ctor.prototype);

	return names.filter(n => !isNameToSkip(n)).map(name => getPrototypeMember(name, ctor.prototype[name]));

	function getPrototypeMember(name: string, obj: any) {
		if (typeof obj !== 'function') {
			return '';
		}

		if (isNativeFunction(obj)) {
			return  `${name}(...args: any[]): any;`;
		} else {
			const funcType = getParameterListAndReturnType(obj, parseFunctionBody(obj));
			return `${name}(${funcType[0]}): ${funcType[1]};`;
		}
	}

	function isNameToSkip(s: string) {
		return (s === 'constructor') || (s[0] === '_');
	}
}

function getClassInstanceMembers(ctor: any): string[] {
	if (isNativeFunction(ctor)) {
		return [];
	}

	const body = parseFunctionBody(ctor);
	const members: string[] = [];

	function visit(node: ts.Node) {
		switch(node.kind) {
			case ts.SyntaxKind.BinaryExpression:
				if ((node as ts.BinaryExpression).operatorToken.kind === ts.SyntaxKind.EqualsToken) {
					const lhs = (node as ts.BinaryExpression).left;
					if (lhs.kind === ts.SyntaxKind.PropertyAccessExpression) {
						if ((lhs as ts.PropertyAccessExpression).expression.kind === ts.SyntaxKind.ThisKeyword) {
							members.push((lhs as ts.PropertyAccessExpression).name.getText() + ': any;');
						}
					}
				}
				break;
		}
		ts.forEachChild(node, visit);
	}

	return members;
}

function declarationComparer(left: Declaration, right: Declaration) {
	if (left.kind === right.kind) {
		return left.name > right.name ? 1 : left.name < right.name ? -1 : 0;
	} else {
		return left.kind > right.kind ? 1 : left.kind < right.kind ? -1 : 0;
	}
}

function getParameterListAndReturnType(obj: Function, fn: ts.FunctionExpression): [string, string] {
	let usedArguments = false;
	let hasReturn = false;
	const funcStack: boolean[] = [];

	if (isNativeFunction(obj)) {
		const args: string[] = [];
		for (let i = 0; i < obj.length; i++) {
			args.push(`p${i}: any`);
		}
		return [args.join(', '), 'any'];
	} else {
		ts.forEachChild(fn, visit);
		function visit(node: ts.Node) {
			switch (node.kind) {
				case ts.SyntaxKind.Identifier:
					if ((node as ts.Identifier).getText() === 'arguments') {
						usedArguments = true;
					}
					break;
				case ts.SyntaxKind.ReturnStatement:
					if (funcStack.length === 0 && (node as ts.ReturnStatement).expression && (node as ts.ReturnStatement).kind !== ts.SyntaxKind.VoidExpression) {
						hasReturn = true;
					}
			}
			switch (node.kind) {
				case ts.SyntaxKind.FunctionExpression:
				case ts.SyntaxKind.FunctionDeclaration:
					funcStack.push(true);
					ts.forEachChild(node, visit);
					funcStack.pop();

				default:
					ts.forEachChild(node, visit);
					break;
			}
		}

		let args = fn.parameters.map(p => `${p.name.getText()}: ${inferParameterType(fn, p)}`);
		if (usedArguments) {
			args.push('...args: any[]');
		}
		return [args.join(', '), hasReturn ? 'any' : 'void'];
	}
}

function inferParameterType(fn: ts.FunctionExpression, param: ts.ParameterDeclaration) {
	return 'any';
}

function parseFunctionBody(fn: any): ts.FunctionExpression {
	const setup = `const myFn = ${fn.toString()};`;
	const srcFile = ts.createSourceFile('test.ts', setup, ts.ScriptTarget.Latest, true);
	const statement = srcFile.statements[0] as ts.VariableStatement;
	const decl = statement.declarationList.declarations[0];
	const init = decl.initializer as ts.FunctionExpression;
	return init;
}

function isNativeFunction(fn: any) {
	return fn.toString().indexOf('{ [native code] }') > 0;
}

