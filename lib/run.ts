import * as guess from './index';
import * as yargs from 'yargs';

interface Options {
	module?: string;
}
const args: Options = yargs
	.alias('m', 'module')
	.argv;


const opts: Options = yargs.argv;

if (args.module) {
	console.log(guess.generateModuleDeclarationFile(args.module, require(args.module)));
} else {
	console.log('Usage: tsguess -m moduleName');
	console.log('Example: tsguess -m fs');
}
