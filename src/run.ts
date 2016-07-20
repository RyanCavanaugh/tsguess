import * as guess from './index';
import * as yargs from 'yargs';

interface Options {
	identifier?: string;
	expression?: string;
	module?: string;
}
const args: Options = yargs
	//.alias('i', 'identifier')
	//.alias('e', 'expression')
	.alias('m', 'module')
	.argv;


const opts: Options = yargs.argv;

if (args.module) {
	console.log(guess.generateModuleDeclarationFile(args.module));
} else if(args.expression) {
	console.log(guess.generateExpressionDeclarationFile(args.expression));
} else if(args.identifier) {
	console.log(guess.generateExpressionDeclarationFile(args.identifier));
} else {
	console.log('Usage: tsguess -m moduleName');
	console.log('Example: tsguess -m fs');
}
