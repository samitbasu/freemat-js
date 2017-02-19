import Tokenize from './scanner';
import { readFileSync } from 'fs';

let filename = process.argv[2];
console.log('Scanning file ', filename);
let txt = readFileSync(filename);
console.time('run');
let toks = Tokenize(txt.toString());
console.timeEnd('run');
console.log(toks);
