import * as AST from './ast';

// Compute the union of the tokens 
function UnionPos(toks: AST.Node[]): [number, number] {
    if (toks.length === 0) return [0, 0];
    let minpos = toks[0].pos;
    let maxpos = toks[0].end;
    for (let tok of toks) {
        minpos = Math.min(minpos, tok.pos);
        maxpos = Math.max(maxpos, tok.end);
    }
    return [minpos, maxpos];
}

export class Parser {
    readonly tokens: AST.Node[];
    pos: number;
    constructor(tok: AST.Node[]) {
        this.tokens = tok;
        this.pos = 0;
    }
    isKind(kind: AST.SyntaxKind): boolean {
        return this.token().kind === kind;
    }
    token(): AST.Node {
        return this.tokens[this.pos];
    }
    isSpacing(): boolean {
        return (this.isKind(AST.SyntaxKind.Whitespace) ||
            this.isKind(AST.SyntaxKind.Comment) ||
            this.isKind(AST.SyntaxKind.NewlineToken));
    }
    isEndOfText(): boolean {
        return this.isKind(AST.SyntaxKind.EndOfTextToken);
    }
    block(): AST.Block {
        let statements: AST.Statement[] = [];
        let more: boolean = true;
        while (more) {
            if (this.isSpacing()) this.pos++;
            if (!this.isEndOfText()) {
                statements.push(this.statement());
            }
            more = !this.isEndOfText();
        }
        let [pos, end] = UnionPos(statements);
        let ret: AST.Block = {
            kind: AST.SyntaxKind.Block,
            statements: statements,
            pos: pos,
            end: end
        };
        return ret;
    }
    statement(): AST.Statement {
        if (this.isKind(AST.SyntaxKind.ForToken))
            return this.forStatement();
        if (this.isKind(AST.SyntaxKind.BreakToken))
            return this.breakStatement();
        if (this.isKind(AST.SyntaxKind.ContinueToken))
            return this.continueStatement();
        if (this.isKind(AST.SyntaxKind.WhileToken))
            return this.whileStatement();
        if (this.isKind(AST.SyntaxKind.IfToken))
            return this.ifStatement();
        if (this.isKind(AST.SyntaxKind.SwitchToken))
            return this.switchStatement();
        if (this.isKind(AST.SyntaxKind.TryToken))
            return this.tryStatement();
        if (this.isKind(AST.SyntaxKind.ThrowToken))
            return this.throwStatement();
        if (this.isKind(AST.SyntaxKind.ReturnToken))
            return this.returnStatement();
        if (this.isKind(AST.SyntaxKind.GlobalToken) ||
            this.isKind(AST.SyntaxKind.PersistentToken))
            return this.declarationStatement();
        if (this.isKind(AST.SyntaxKind.FunctionToken))
            return this.functionStatement();
        if (this.isKind(AST.SyntaxKind.ClassDefToken))
            return this.classDefStatement();
        // All of the remaining are speculative parses - it could be an assignment (a = 1)
        // multi-assignment ([a,b] = 3), or an expression statement.
        // the key to it being an expression statement is the absence of an '=' token
        if (this.isAssignment())
            return this.assignmentStatement();
        // Everything else is an expression
        return this.expressionStatement();
    }
    forStatement(): AST.ForStatement {

    }
}
