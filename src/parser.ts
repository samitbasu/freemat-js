import * as AST from './ast';
import Tokenizer from './scanner';

class Parser {
    readonly tokens: AST.Node[];
    constructor(tok: AST.Node[]) {
        this.tokens = tok;
    }
    parseBlock(): AST.Block {
        statements: AST.Statement[];
        parseSpacing();
    }
    parseSpacing() {

    }
}
