import * as guess from './index';
import * as yargs from 'yargs';

interface Options {
	expression?: string;
	module?: string;
}
const args: Options = yargs
	.alias('e', 'expression')
	.alias('m', 'module')
	.argv;


const opts: Options = yargs.argv;

let expr: any = undefined;
if (args.expression) {
	expr = eval(args.expression);
} else if (args.module) {
	expr = require(args.module);
}
console.log(guess.guess(expr));
