import Tokenize from './scanner';
import Walker from './walker';
import { Parser } from './parser';
import { readFileSync } from 'fs';
//import { inspect } from 'util';

let filename = process.argv[2];
console.log('Scanning file ', filename);
let txt = readFileSync(filename);
console.time('run');
let toks = Tokenize(txt.toString());
console.timeEnd('run');
console.log(toks);
let pars = new Parser(toks, txt.toString());
let blk = pars.block();
//console.log(inspect(blk, { depth: null }));
console.log(Walker(blk));

