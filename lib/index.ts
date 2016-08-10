import * as ts from 'typescript';
import * as _ from 'underscore';
import * as dom from 'ts-dom';
import { create } from 'ts-dom';

type object = { valueOf: 'oops '; prototype?: object; (): void;[s: string]: any; };

const enum ValueTypes {
	None = 0,
	Class = 1 << 0,
	Function = 1 << 1,
	Object = 1 << 2,
	Primitive = 1 << 3,
	NullOrUndefined = 1 << 4,
	Unknown = 1 << 5
}

function getValueTypes(value: any): ValueTypes {
	if (typeof value === 'object') {
		// Objects can't be callable, so no need to check for class / function
		return ValueTypes.Object;
	} else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
		return ValueTypes.Primitive;
	} else if (value === null || value === undefined) {
		return ValueTypes.NullOrUndefined;
	} else if (typeof value === 'function') {
		if (isClasslike(value)) {
			return ValueTypes.Class | (hasCloduleProperties(value) ? ValueTypes.Object : ValueTypes.None);
		} else {
			return ValueTypes.Function | (hasFunduleProperties(value) ? ValueTypes.Object : ValueTypes.None);
		}
	} else {
		return ValueTypes.Unknown;
	}
}

// A class has clodule properties if it has any classes. Anything else can be written with 'static'
function hasCloduleProperties(c: any): boolean {
	return getKeysOfObject(c).some(k => isClasslike(c[k]));
}

// A function has fundule properties if it has any own properties not belonging to Function.prototype
function hasFunduleProperties(fn: any): boolean {
	return getKeysOfObject(fn).some(k => (<any>Function)[k] === undefined);
}

export function generateModuleDeclarationFile(nameHint: string, root: any) {
	const decls = getTopLevelDeclarations(nameHint, root);

	return decls.map(dom.emit).join('\r\n');
}

export function generateIdentifierDeclarationFile(name: string, value: any): string {
	const result = getTopLevelDeclarations(name, value)
	return result.map(dom.emit).join('\r\n');
}

const walkStack = new Map<any, boolean>();

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

	keys.sort();
	return keys;
}

function isVisitableName(s: string) {
	return (s[0] !== '_') && (["caller", "arguments", "constructor", "super_"].indexOf(s) < 0);
}

function isCallable(obj: {}) {
	return typeof obj === 'function';
}

function isClasslike(obj: object): boolean {
	return !!(obj.prototype && Object.getOwnPropertyNames(obj.prototype).length > 1);
}

function getTopLevelDeclarations(name: string, obj: any): dom.TopLevelDeclaration[] {
	if (walkStack.has(obj)) {
		// Circular reference
		return [create.const(name, dom.type.any)];
	}

	walkStack.set(obj);
	const res = getResult();
	walkStack.delete(obj);
	return res;

	function getResult(): dom.TopLevelDeclaration[] {
		if (typeof obj === 'function') {
			const funcType = getParameterListAndReturnType(obj as any as Function, parseFunctionBody(obj));
			if (isClasslike(obj)) {
				const cls = dom.create.class(name)
				getClassInstanceMembers(obj).forEach(m => cls.members.push(m));
				getClassPrototypeMembers(obj).forEach(m => cls.members.push(m));
				cls.members.push(dom.create.constructor(funcType[0]));
				cls.members.sort(declarationComparer);

				// Get clodule members
				const ns = dom.create.namespace(name);
				const keys = getKeysOfObject(obj);
				for (const k of keys) {
					getTopLevelDeclarations(k!, obj[k!]).forEach(p => ns.members.push(p));
				}

				return ns.members.length > 0 ? [cls, ns] : [cls];
			} else {
				// TODO: Get fundule members
				const parsedFunction = parseFunctionBody(obj);
				const info = getParameterListAndReturnType(obj as {} as Function, parsedFunction);
				return [dom.create.function(name, info[0], info[1])];
			}
		} else if (typeof obj === 'object') {
			if (Array.isArray(obj)) {
				if (obj.length > 0) {
					return [dom.create.const(name, create.array(getTypeOfValue(obj[0])))];
				} else {
					return [dom.create.const(name, create.array(dom.type.any))];
				}
			}

			// If anything in here is classlike or functionlike, write it as a namespace.
			// Otherwise, write as a 'const'
			const types = getValueTypes(obj);
			const keys = getKeysOfObject(obj);
			let constituentTypes = ValueTypes.None;
			for (const k of keys) {
				constituentTypes = constituentTypes | getValueTypes((<any>obj)[k!]);
			}
			if (constituentTypes & (ValueTypes.Class | ValueTypes.Function)) {
				const ns = dom.create.namespace(name);
				for (const k of keys) {
					const decls = getTopLevelDeclarations(k!, (<any>obj)[k!]);
					decls.forEach(d => ns.members.push(d));
				}
				ns.members.sort(declarationComparer);
				return [ns];
			} else {
				return [dom.create.const(name, getTypeOfValue(obj))];
			}
		} else if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
			return [create.const(name, <dom.Type>(typeof obj))];
		} else {
			return [create.const(name, dom.type.any)];
		}
	}
}

function getTypeOfValue(value: any): dom.Type {
	const res = getResult();
	return res;

	function getResult() {
		switch (typeof value) {
			case 'string':
			case 'number':
			case 'boolean':
				return <dom.Type>(typeof value);
			case 'undefined':
				return dom.type.any;
			case 'object':
				if (value instanceof Date) {
					return create.namedTypeReference('Date');
				} else if (value === null) {
					return dom.type.any;
				} else {
					walkStack.set(value);
					const members = getPropertyDeclarationsOfObject(value);
					walkStack.delete(value);
					members.sort(declarationComparer);
					const objType = dom.create.objectType(members);
					return objType;
				}
			default:
				return dom.type.any;
		}
	}
}

function getPropertyDeclarationsOfObject(obj: any): dom.ObjectTypeMember[] {
	walkStack.set(obj);
	const keys = getKeysOfObject(obj);
	const result = keys.map(getProperty);
	walkStack.delete(obj);
	return result;

	function getProperty(k: string) {
		if (walkStack.has(obj[k])) {
			return create.property(k, dom.type.any);
		}
		return create.property(k, getTypeOfValue(obj[k]));
	}
}

function getClassPrototypeMembers(ctor: any): dom.ClassMember[] {
	const names = Object.getOwnPropertyNames(ctor.prototype);
	const members = <dom.ClassMember[]>names.filter(n => !isNameToSkip(n)).map(name => getPrototypeMember(name, ctor.prototype[name])).filter(m => m !== undefined);
	members.sort();
	return members;

	function getPrototypeMember(name: string, obj: any): dom.ClassMember | undefined {
		// Skip non-function objects on the prototype (not sure what to do with these?)
		if (typeof obj !== 'function') {
			return undefined;
		}

		if (isNativeFunction(obj)) {
			return create.method(name, [create.parameter('args', dom.type.array(dom.type.any), dom.ParameterFlags.Rest)], dom.type.any);
		} else {
			const funcType = getParameterListAndReturnType(obj, parseFunctionBody(obj));
			return create.method(name, funcType[0], funcType[1]);
		}
	}

	function isNameToSkip(s: string) {
		return (s === 'constructor') || (s[0] === '_');
	}
}

// Parses assignments to 'this.x' in the constructor into class property declarations
function getClassInstanceMembers(ctor: any): dom.ClassMember[] {
	if (isNativeFunction(ctor)) {
		return [];
	}

	const body = parseFunctionBody(ctor);
	const members: dom.ClassMember[] = [];

	function visit(node: ts.Node) {
		switch (node.kind) {
			case ts.SyntaxKind.BinaryExpression:
				if ((node as ts.BinaryExpression).operatorToken.kind === ts.SyntaxKind.EqualsToken) {
					const lhs = (node as ts.BinaryExpression).left;
					if (lhs.kind === ts.SyntaxKind.PropertyAccessExpression) {
						if ((lhs as ts.PropertyAccessExpression).expression.kind === ts.SyntaxKind.ThisKeyword) {
							members.push(create.property((lhs as ts.PropertyAccessExpression).name.getText(), dom.type.any, dom.MemberFlags.None));
						}
					}
				}
				break;
		}
		ts.forEachChild(node, visit);
	}

	return members;
}

function declarationComparer(left: any, right: any) {
	if (left.kind === right.kind) {
		return left.name > right.name ? 1 : left.name < right.name ? -1 : 0;
	} else {
		return left.kind > right.kind ? 1 : left.kind < right.kind ? -1 : 0;
	}
}

function getParameterListAndReturnType(obj: Function, fn: ts.FunctionExpression): [dom.Parameter[], dom.Type] {
	let usedArguments = false;
	let hasReturn = false;
	const funcStack: boolean[] = [];

	if (isNativeFunction(obj)) {
		const args: dom.Parameter[] = [];
		for (let i = 0; i < obj.length; i++) {
			args.push(create.parameter(`p${i}`, dom.type.any));
		}
		return [args, dom.type.any];
	} else {
		ts.forEachChild(fn, visit);

		let params = [create.parameter('args', dom.type.array(dom.type.any), dom.ParameterFlags.Rest)];
		if (fn.parameters) {
			params = fn.parameters.map(p => create.parameter(`${p.name.getText()}`, inferParameterType(fn, p)));
			if (usedArguments) {
				params.push(create.parameter('args', dom.type.array(dom.type.any), dom.ParameterFlags.Rest));
			}
		}
		return [params, hasReturn ? dom.type.any : dom.type.void];
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

function inferParameterType(fn: ts.FunctionExpression, param: ts.ParameterDeclaration): dom.Type {
	// TODO: Inspect function body for clues
	return dom.type.any;
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
