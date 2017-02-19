import { Lexer } from './scanner';
import * as AST from './ast';
import { readFileSync } from 'fs';

let filename = process.argv[2];
console.log('Scanning file ', filename);
let txt = readFileSync(filename);
let lex = new Lexer(txt.toString());
let more = true;
while (more) {
    let tok = lex.nextToken();
    console.log(AST.SyntaxKind[tok.kind], tok);
    more = tok.kind != AST.SyntaxKind.EndOfTextToken;
}
