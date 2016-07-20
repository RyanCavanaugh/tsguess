import * as ts from 'typescript';
import * as _ from 'underscore';

type object = { valueOf: 'oops '; prototype?: object; (): void;[s: string]: any; };

interface DeclarationBase {
	name: string;
}

interface ObjectDeclaration extends DeclarationBase {
	kind: "object";
	members: Declaration[];
}

interface ValueDeclaration extends DeclarationBase {
	kind: "value";
	type: string;
}

interface ClassDeclaration extends DeclarationBase {
	kind: "class";
	constructorParameters: string;
	staticMembers: ValueDeclaration[];
	instanceMembers: ValueDeclaration[];
	prototypeMembers: FunctionDeclaration[];
}

interface FunctionDeclaration extends DeclarationBase {
	kind: "function";
	parameters: string;
	returnType: string;
	additionalMembers: Declaration[];
}

type Declaration = ObjectDeclaration | ValueDeclaration | ClassDeclaration | FunctionDeclaration;

export function generateIdentifierDeclarationFile(id: string) {

}

export function generateExpressionDeclarationFile(expr: string) {

}

export function generateModuleDeclarationFile(expr: string) {
	const moduleObject = require(expr);

	const declarations = getPropertiesOfObject(moduleObject).sort(declarationComparer);

	let lines: string[];
	if (isCallable(moduleObject)) {
		const selfName = makeIdentifier(expr);
		// Need to generate an 'export ='-style definition
		lines = [
			'declare ' + declarationToNamespaceMember(getDeclarationForProperty(selfName, moduleObject)),
			`declare namespace ${selfName} {`,
			...declarations.map(declarationToNamespaceMember).map(indent),
			`}`,
			`export = ${selfName};`
		];
	} else {
		lines = declarations.map(declarationToModuleMember);
	}
	return lines.join('\r\n');
}

function indent(s: string): string {
	return s.split(/\r\n/g).map(line => '    ' + line).join('\r\n');
}

function declarationToNamespaceMember(decl: Declaration): string {
	switch (decl.kind) {
		case "object":
			return objectDeclarationToString(decl as ObjectDeclaration);
		case "value":
			const val = decl as ValueDeclaration;
			return `const ${val.name}: ${val.type};`;
		case "class":
			return classDeclarationToString(decl as ClassDeclaration);
		case "function":
			return functionDeclarationToString(decl as FunctionDeclaration);
		default:
			throw new Error('Unknown decl kind');
	}
}

function declarationToModuleMember(decl: Declaration): string {
	return 'export ' + declarationToNamespaceMember(decl);
}

function objectDeclarationToString(decl: ObjectDeclaration): string {
	// Heuristic: Use 'const' when objects contain only value members
	if (decl.members.every(m => m.kind === "value")) {
		const members = decl.members as ValueDeclaration[];
		return [`const ${decl.name}: {`, ...members.map(m => `${m.name}: ${m.type}`).map(indent), `};`].join('\r\n');
	} else {
		return [`namespace ${decl.name} {`, ...decl.members.map(declarationToNamespaceMember).map(indent), `}`].join('\r\n');
	}
}

function classDeclarationToString(decl: ClassDeclaration): string {
	// TODO: Determine when we have to use a clodule for static members
	const lines = [
		`class ${decl.name} {`,
		indent(`constructor(${decl.constructorParameters});`),
		...decl.instanceMembers.map(m => `${m.name}: ${m.type};`).map(indent),
		...decl.prototypeMembers.map(m => `${m.name}(${m.parameters}): ${m.returnType};`).map(indent),
		...decl.staticMembers.map(m => `static ${m.name}: ${m.type}`).map(indent),
		'}'
	];
	return lines.join('\r\n');
}

function functionDeclarationToString(decl: FunctionDeclaration): string {
	const result = `function ${decl.name}(${decl.parameters}): ${decl.returnType};`;
	if (canEmitAsIdentifier(decl.name)) {
		return result;
	} else {
		return '/* ' + result + '*/';
	}
}

function getPropertiesOfObject(obj: object): Declaration[] {
	const keys = getKeysOfObject(obj);
	return keys.map(key => getDeclarationForProperty(key, obj[key]));
}

const reservedFunctionProperties = Object.getOwnPropertyNames(function() { });
function getKeysOfObject(obj: object) {
	let keys: string[] = [];
	let chain: {} = obj;
	do {
		if (chain == null) break;
		keys = keys.concat(Object.getOwnPropertyNames(chain))
		chain = Object.getPrototypeOf(chain);
	} while (chain !== Object.prototype && chain !== Function.prototype);
	keys = _.unique(keys).filter(s => isVisitableName(s));
	if (typeof obj === 'function') {
		keys = keys.filter(k => reservedFunctionProperties.indexOf(k) < 0);
	}

	return keys;
}

function isVisitableName(s: string) {
	return (s[0] !== '_') && (["caller", "arguments", "constructor"].indexOf(s) < 0);
}

function isCallable(obj: {}) {
	return typeof obj === 'function';
}

function isClasslike(obj: object) {
	return obj.prototype && Object.getOwnPropertyNames(obj.prototype).length > 1;
}

function getDeclarationForProperty(name: string, obj: object): Declaration {
	if (typeof obj === 'function') {
		if (isClasslike(obj)) {
			return {
				kind: "class",
				name,
				constructorParameters: getParameterListAndReturnType(obj as {} as Function, parseFunctionBody(obj))[0],
				prototypeMembers: getClassPrototypeMembers(obj),
				instanceMembers: getClassInstanceMembers(obj),
				staticMembers: []
			} as ClassDeclaration;
		} else {
			const parsedFunction = parseFunctionBody(obj);
			const info = getParameterListAndReturnType(obj as {} as Function, parsedFunction);
			return {
				kind: "function",
				name,
				additionalMembers: [],
				parameters: info[0],
				returnType: info[1]
			};
		}
	} else if (typeof obj === 'object') {
		return {
			kind: "object",
			name,
			members: getKeysOfObject(obj).map(k => getDeclarationForProperty(k, (obj as any)[k]))
		}
	} else if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
		return {
			kind: "value",
			name,
			type: typeof obj
		}
	} else {
		return {
			kind: "value",
			name,
			type: 'any'
		}
	}
}

function getClassPrototypeMembers(ctor: any): Declaration[] {
	const names = Object.getOwnPropertyNames(ctor.prototype);

	return <Declaration[]>names.filter(n => !isNameToSkip(n)).map(name => getPrototypeMember(name, ctor.prototype[name])).filter(m => m !== undefined);

	function getPrototypeMember(name: string, obj: any): FunctionDeclaration | undefined {
		if (typeof obj !== 'function') {
			return undefined;
		}

		if (isNativeFunction(obj)) {
			return {
				kind: 'function',
				name,
				parameters: '...args: any[]',
				returnType: 'any',
				additionalMembers: []
			};
		} else {
			const funcType = getParameterListAndReturnType(obj, parseFunctionBody(obj));
			return {
				kind: 'function',
				name,
				parameters: funcType[0],
				returnType: funcType[1],
				additionalMembers: []
			};
		}
	}

	function isNameToSkip(s: string) {
		return (s === 'constructor') || (s[0] === '_');
	}
}

function getClassInstanceMembers(ctor: any): Declaration[] {
	if (isNativeFunction(ctor)) {
		return [];
	}

	const body = parseFunctionBody(ctor);
	const members: ValueDeclaration[] = [];

	function visit(node: ts.Node) {
		switch (node.kind) {
			case ts.SyntaxKind.BinaryExpression:
				if ((node as ts.BinaryExpression).operatorToken.kind === ts.SyntaxKind.EqualsToken) {
					const lhs = (node as ts.BinaryExpression).left;
					if (lhs.kind === ts.SyntaxKind.PropertyAccessExpression) {
						if ((lhs as ts.PropertyAccessExpression).expression.kind === ts.SyntaxKind.ThisKeyword) {
							members.push({
								kind: "value",
								name: (lhs as ts.PropertyAccessExpression).name.getText(),
								type: 'any'
							});
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

		let params = ['...args: any[]'];
		if (fn.parameters) {
			params = fn.parameters.map(p => `${p.name.getText()}: ${inferParameterType(fn, p)}`);
			if (usedArguments) {
				params.push('...args: any[]');
			}
		}
		return [params.join(', '), hasReturn ? 'any' : 'void'];
	}

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

}

const reservedWords = 'instanceof typeof break do new var case else return void catch finally continue for switch while this with debugger function throw default if try delete in'.split(/ /g);
function canEmitAsIdentifier(s: string) {
	return /^[$A-Z_][0-9A-Z_$]*$/i.test(s) && reservedWords.indexOf(s) < 0;
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

function makeIdentifier(s: string) {
	return s.replace(/-/g, '_');
}
