import * as AST from './ast';

//Daniel Shub replied on May 24th, 2013 12:45 pm UTC : 2 of 4
//I avoid the command syntax religiously in my functions. From the command line sometimes I use the command line version of functions like edit, doc, clear for convenience. I would gladly give up the command line version if MATLAB would treat the oddly spaced x ==0, the same as x==0, x == 0, and the oddly spaced x== 0. Programming languages, especially ones that allow you to generally use whitespace freely, should not have crazy whitespace dependencies.
//
//You mentioned overhead of the parenthesis and comma separators. Is the commandline interface faster? I would have thought it would have been slower.
//
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

const enum OpType {
    Prefix,
    Infix,
    Postfix
};

// MATLAB does not have right associative operators:
// You can build expressions that use any combination of arithmetic, relational, and logical operators.
// Precedence levels determine the order in which MATLAB® evaluates an expression. Within each precedence
// level, operators have equal precedence and are evaluated from left to right. The precedence rules for
// MATLAB operators are shown in this list, ordered from highest precedence level to lowest precedence
// level:
// https://www.mathworks.com/help/matlab/matlab_prog/operator-precedence.html

interface OperatorDetails {
    optype: OpType,
    mapped_operator?: AST.UnaryOperator,
    precedence: number,
};

const unary_table = new Map<AST.SyntaxKind, OperatorDetails>([
    [AST.SyntaxKind.PlusToken,          // Unary plus - priority 4
    {
        optype: OpType.Prefix,
        precedence: 9,
        mapped_operator: AST.SyntaxKind.UnaryPlusToken
    }],
    [AST.SyntaxKind.MinusToken,         // Unary minus - priority 4
    {
        optype: OpType.Prefix,
        precedence: 9,
        mapped_operator: AST.SyntaxKind.UnaryMinusToken
    }],
    [AST.SyntaxKind.NotToken,           // Unary not - priority 4
    {
        optype: OpType.Prefix,
        precedence: 9,
        mapped_operator: AST.SyntaxKind.NotToken
    }]
]);

const operator_table = new Map<AST.SyntaxKind, OperatorDetails>([
    [AST.SyntaxKind.OrOrToken,  // Short circuit OR - priority 12
    {
        optype: OpType.Infix,
        precedence: 1,
    }],
    [AST.SyntaxKind.AndAndToken, // Short circuit AND - priority 11
    {
        optype: OpType.Infix,
        precedence: 2,
    }],
    [AST.SyntaxKind.OrToken,    // Element-wise OR - priority 10
    {
        optype: OpType.Infix,
        precedence: 3,
    }],
    [AST.SyntaxKind.AndToken,   // Element-wise AND - priority 9
    {
        optype: OpType.Infix,
        precedence: 4,
    }],
    [AST.SyntaxKind.LessThanToken, // Less than - priority 8
    {
        optype: OpType.Infix,
        precedence: 5,
    }],
    [AST.SyntaxKind.GreaterThanToken, // Greater than - priority 8
    {
        optype: OpType.Infix,
        precedence: 5,
    }],
    [AST.SyntaxKind.LessEqualsToken, // Less equals - priority 8
    {
        optype: OpType.Infix,
        precedence: 5,
    }],
    [AST.SyntaxKind.GreaterEqualsToken, // Greater equals - priority 8
    {
        optype: OpType.Infix,
        precedence: 5,
    }],
    [AST.SyntaxKind.EqualsEqualsToken, // Equal to - priority 8
    {
        optype: OpType.Infix,
        precedence: 5,
    }],
    [AST.SyntaxKind.NotEqualsToken, // Not equal to - priority 8
    {
        optype: OpType.Infix,
        precedence: 5,
    }],
    [AST.SyntaxKind.ColonToken,     // Colon operator - priority 7
    {
        optype: OpType.Infix,
        precedence: 6,
    }],
    [AST.SyntaxKind.PlusToken,      // Addition - priority 6
    {
        optype: OpType.Infix,
        precedence: 7,
    }],
    [AST.SyntaxKind.MinusToken,     // Subtraction - priority 6
    {
        optype: OpType.Infix,
        precedence: 7,
    }],
    [AST.SyntaxKind.TimesToken,     // Matrix multiplication - priority 5
    {
        optype: OpType.Infix,
        precedence: 8,
    }],
    [AST.SyntaxKind.RightDivideToken, // Matrix right division - priority 5
    {
        optype: OpType.Infix,
        precedence: 8,
    }],
    [AST.SyntaxKind.LeftDivideToken,  // Matrix left division - priority 5
    {
        optype: OpType.Infix,
        precedence: 8,
    }],
    [AST.SyntaxKind.DotTimesToken,    // Multiplication - priority 5
    {
        optype: OpType.Infix,
        precedence: 8,
    }],
    [AST.SyntaxKind.DotRightDivideToken, // Right division - priority 5
    {
        optype: OpType.Infix,
        precedence: 8,
    }],
    [AST.SyntaxKind.DotLeftDivideToken, // Left division - priority 5
    {
        optype: OpType.Infix,
        precedence: 8,
    }],
    // TODO - add .^-, .^+, .^~, ^-, ^+, ^~ at precedence 10
    [AST.SyntaxKind.PowerToken,          // Matrix power - priority 2
    {
        optype: OpType.Infix,
        precedence: 11,
    }],
    [AST.SyntaxKind.DotPowerToken,       // Power - priority 2
    {
        optype: OpType.Infix,
        precedence: 11,
    }],
    [AST.SyntaxKind.TransposeToken,
    {
        optype: OpType.Postfix,
        precedence: 11,
    }],
    [AST.SyntaxKind.HermitianToken,
    {
        optype: OpType.Postfix,
        precedence: 11
    }]

]);

function is_unary(kind: AST.SyntaxKind): boolean {
    return unary_table.has(kind);
}

export class Parser {
    readonly tokens: AST.Node[];
    readonly txt: string;
    pos: number;
    constructor(tok: AST.Node[], txt: string) {
        this.tokens = tok;
        this.txt = txt;
        this.pos = 0;
    }
    mergeBlob(x: AST.Blob, y: AST.Node): AST.Blob {
        if (x.text === '') {
            x.pos = y.pos;
            x.end = y.end;
        } else {
            x.end = y.end;
        }
        x.text += this.txt.substr(y.pos, y.end - y.pos);
        return x;
    }
    consume(): AST.Node {
        let current = this.token();
        //        console.log("Consumed token: ", AST.SyntaxKind[current.kind]);
        this.pos++;
        return current;
    }
    expect(kind: AST.SyntaxKind): AST.Node {
        let current = this.token();
        if (this.isKind(kind)) {
            this.pos++;
        } else {
            let msg: string = `Parse error: expecting ${AST.SyntaxKind[kind]} at position ${current.pos}, and got ${AST.SyntaxKind[current.kind]} instead`;
            throw new Error(msg);
        }
        //        console.log("Consumed token: ", AST.SyntaxKind[kind]);
        return current;
    }
    isKind(kind: AST.SyntaxKind): boolean {
        if (this.pos < this.tokens.length)
            return this.token().kind === kind;
        return false;
    }
    token(): AST.Node {
        return this.tokens[this.pos];
    }
    next(ahead: number = 1): AST.Node {
        if (this.pos + ahead < this.tokens.length)
            return this.tokens[this.pos + ahead];
        return this.tokens[this.tokens.length - 1];
    }
    isSpacing(): boolean {
        return (this.isKind(AST.SyntaxKind.Whitespace) ||
            this.isKind(AST.SyntaxKind.Comment) ||
            this.isKind(AST.SyntaxKind.NewlineToken));
    }
    isEndOfText(): boolean {
        return this.isKind(AST.SyntaxKind.EndOfTextToken);
    }
    isStatementToken(): boolean {
        return !(this.isEndOfText() || this.isKind(AST.SyntaxKind.EndToken) ||
            this.isKind(AST.SyntaxKind.ElseToken) || this.isKind(AST.SyntaxKind.ElseIfToken) ||
            this.isKind(AST.SyntaxKind.CatchToken) || this.isKind(AST.SyntaxKind.CaseToken) ||
            this.isKind(AST.SyntaxKind.OtherwiseToken));
    }
    munchWhiteSpace(): void {
        while (this.isSpacing()) this.pos++;
    }
    block(): AST.Block {
        let statements: AST.Statement[] = [];
        let more: boolean = true;
        while (more) {
            this.munchWhiteSpace();
            if (this.isStatementToken()) {
                let statement = this.statement();
                statement.printit = !this.statementSep();
                //                console.log("statement:", statement);
                statements.push(statement);
            }
            more = this.isStatementToken();
            //            console.log("this token:", this.token());
            //            console.log("more:", more);
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
        if (this.isKind(AST.SyntaxKind.CommaToken) ||
            this.isKind(AST.SyntaxKind.SemiColonToken))
            return this.emptyStatement();
        if (this.isKind(AST.SyntaxKind.ForToken))
            return this.forStatement();
        if (this.isKind(AST.SyntaxKind.BreakToken))
            return this.singletonStatement(AST.SyntaxKind.BreakStatement);
        if (this.isKind(AST.SyntaxKind.ContinueToken))
            return this.singletonStatement(AST.SyntaxKind.ContinueStatement);
        if (this.isKind(AST.SyntaxKind.WhileToken))
            return this.whileStatement();
        if (this.isKind(AST.SyntaxKind.IfToken))
            return this.ifStatement();
        if (this.isKind(AST.SyntaxKind.SwitchToken))
            return this.switchStatement();
        if (this.isKind(AST.SyntaxKind.TryToken))
            return this.tryStatement();
        if (this.isKind(AST.SyntaxKind.ReturnToken))
            return this.singletonStatement(AST.SyntaxKind.ReturnStatement);
        if (this.isKind(AST.SyntaxKind.GlobalToken) ||
            this.isKind(AST.SyntaxKind.PersistentToken))
            return this.declarationStatement();
        if (this.isKind(AST.SyntaxKind.FunctionToken))
            return this.functionStatement();
	/*
        if (this.isKind(AST.SyntaxKind.ClassDefToken))
            return this.classDefStatement();
*/
        // All of the remaining are speculative parses - it could be an assignment (a = 1)
        // multi-assignment ([a,b] = 3), or an expression statement.
        // the key to it being an expression statement is the absence of an '=' token
        if (this.isAssignment())
            return this.assignmentStatement();
        // It could be a command-syntax function invocation
        // This is identified (ideally) by a sequence of identifiers
        // separated by whitespace (think "hold on").  However to
        // handle things like "ls -lrt", it has to look for a whitespace
        // followed by something other than an operator + whitespace combo
        // (which is handled as an expression)
        //        console.log("iscommand: ", this.isCommand(), " txt: ", this.txt);
        if (this.isCommand())
            return this.commandStatement();
        return this.expressionStatement();
    }
    functionStatement(): AST.FunctionDef {
        let func_t = this.expect(AST.SyntaxKind.FunctionToken);
        this.munchWhiteSpace();
        let rets = this.functionReturns(); // Includes the equals sign
        let name = this.identifier(); // Get the function name
        let params = this.functionParameters();
        let body = this.block();
        let endpos = body.end;
        if (this.isKind(AST.SyntaxKind.EndToken)) {
            let end_t = this.expect(AST.SyntaxKind.EndToken);
            endpos = end_t.pos;
        }
        let ret: AST.FunctionDef = {
            kind: AST.SyntaxKind.FunctionDefinition,
            name: name,
            returns: rets,
            args: params,
            body: body,
            pos: func_t.pos,
            end: endpos
        }
        return ret;
    }
    functionParameters(): AST.Identifier[] {
        let params: AST.Identifier[] = [];
        this.munchWhiteSpace();
        if (!this.isKind(AST.SyntaxKind.LeftParenthesisToken))
            return params;
        this.expect(AST.SyntaxKind.LeftParenthesisToken);
        while (!this.isKind(AST.SyntaxKind.RightParenthesisToken)) {
            params.push(this.identifier());
            this.munchWhiteSpace();
            if (this.isKind(AST.SyntaxKind.CommaToken)) this.consume();
        }
        this.expect(AST.SyntaxKind.RightParenthesisToken);
        return params;
    }
    functionReturns(): AST.Identifier[] {
        let args: AST.Identifier[] = [];
        if (this.isKind(AST.SyntaxKind.LeftBracketToken)) {
            this.expect(AST.SyntaxKind.LeftBracketToken);
            while (!this.isKind(AST.SyntaxKind.RightBracketToken)) {
                args.push(this.identifier());
                this.munchWhiteSpace();
                if (this.isKind(AST.SyntaxKind.CommaToken)) this.consume();
            }
            this.expect(AST.SyntaxKind.RightBracketToken);
            this.munchWhiteSpace();
            this.expect(AST.SyntaxKind.EqualsToken);
            this.munchWhiteSpace();
            return args;
        }
        // If we have an identifier followed by an '=' then we have a single
        // return
        if (this.isKind(AST.SyntaxKind.Identifier)) {
            let scan = this.pos + 1;
            if (this.tokens[scan].kind === AST.SyntaxKind.Whitespace) scan++;
            if (this.tokens[scan].kind === AST.SyntaxKind.EqualsToken) {
                const id = this.identifier();
                this.munchWhiteSpace();
                this.expect(AST.SyntaxKind.EqualsToken);
                this.munchWhiteSpace();
                args.push(id);
                return args;
            }
        }
        // No arguments
        return args;
    }
    tryStatement(): AST.TryStatement {
        let try_t = this.expect(AST.SyntaxKind.TryToken);
        this.statementSep();
        let blk = this.block();
        let catch_t: AST.CatchStatement | undefined;
        if (this.isKind(AST.SyntaxKind.CatchToken))
            catch_t = this.catchStatement();
        let end = this.expect(AST.SyntaxKind.EndToken);
        let ret: AST.TryStatement = {
            kind: AST.SyntaxKind.TryStatement,
            body: blk,
            catc: catch_t,
            pos: try_t.pos,
            end: end.end
        };
        return ret;
    }
    catchStatement(): AST.CatchStatement {
        let catch_t = this.expect(AST.SyntaxKind.CatchToken);
        this.munchWhiteSpace();
        let ident: AST.Identifier | undefined;
        if (this.isKind(AST.SyntaxKind.Identifier))
            ident = this.identifier();
        this.statementSep();
        let body = this.block();
        let ret: AST.CatchStatement = {
            kind: AST.SyntaxKind.CatchStatement,
            identifier: ident,
            body: body,
            pos: catch_t.pos,
            end: body.end
        };
        return ret;
    }
    switchStatement(): AST.SwitchStatement {
        let swt = this.expect(AST.SyntaxKind.SwitchToken);
        this.munchWhiteSpace();
        let swexpr = this.expression();
        this.munchWhiteSpace();
        this.statementSep();
        let swcases: AST.CaseStatement[] = [];
        while (this.isKind(AST.SyntaxKind.CaseToken)) {
            swcases.push(this.caseStatement());
        }
        let oth: AST.OtherwiseStatement | undefined;
        if (this.isKind(AST.SyntaxKind.OtherwiseToken))
            oth = this.otherwiseStatement();
        let end_t = this.expect(AST.SyntaxKind.EndToken);
        let ret: AST.SwitchStatement = {
            kind: AST.SyntaxKind.SwitchStatement,
            expr: swexpr,
            cases: swcases,
            otherwise: oth,
            pos: swt.pos,
            end: end_t.end
        };
        return ret;
    }
    caseStatement(): AST.CaseStatement {
        this.munchWhiteSpace();
        let cse = this.expect(AST.SyntaxKind.CaseToken);
        this.munchWhiteSpace();
        let expr = this.expression();
        this.statementSep();
        let body = this.block();
        let ret: AST.CaseStatement = {
            kind: AST.SyntaxKind.CaseStatement,
            expression: expr,
            body: body,
            pos: cse.pos,
            end: body.end
        };
        return ret;
    }
    otherwiseStatement(): AST.OtherwiseStatement {
        this.munchWhiteSpace();
        let oth = this.expect(AST.SyntaxKind.OtherwiseToken);
        this.munchWhiteSpace();
        let body = this.block();
        let ret: AST.OtherwiseStatement = {
            kind: AST.SyntaxKind.OtherwiseStatement,
            body: body,
            pos: oth.pos,
            end: body.end
        };
        return ret;
    }
    expressionStatement(): AST.ExpressionStatement {
        let exp = this.expression();
        let ret: AST.ExpressionStatement = {
            kind: AST.SyntaxKind.ExpressionStatement,
            expression: exp,
            pos: exp.pos,
            end: exp.end
        };
        return ret;
    }
    singletonStatement(kind: AST.Singleton): AST.SingletonStatement {
        let tok = this.token();
        this.consume();
        let ret: AST.SingletonStatement = {
            kind: kind,
            pos: tok.pos,
            end: tok.end
        };
        return ret;
    }
    declarationStatement(): AST.DeclarationStatement {
        let scope: AST.DeclarationTypeToken;
        let begin = this.pos;
        if (this.isKind(AST.SyntaxKind.GlobalToken) ||
            this.isKind(AST.SyntaxKind.PersistentToken))
            scope = this.token().kind as AST.DeclarationTypeToken;
        else
            throw new Error("Parse error")
        this.pos++;
        this.munchWhiteSpace();
        let vars: AST.Identifier[] = [];
        while (this.isKind(AST.SyntaxKind.Identifier)) {
            vars.push(this.identifier());
            this.munchWhiteSpace();
        }
        let ret: AST.DeclarationStatement = {
            kind: AST.SyntaxKind.DeclarationStatement,
            scope: scope,
            vars: vars,
            pos: begin,
            end: this.pos
        };
        return ret;
    }
    // TODO - need to refine these rules
    isCommand(): boolean {
        if (!this.isKind(AST.SyntaxKind.Identifier))
            return false;
        let scan = this.pos + 1;
        if (this.tokens[scan].kind !== AST.SyntaxKind.Whitespace)
            return false;
        scan++;
        if (this.tokens[scan].kind === AST.SyntaxKind.LeftParenthesisToken)
            return false;
        if (operator_table.has(this.tokens[scan].kind)) {
            if (this.tokens[scan + 1].kind === AST.SyntaxKind.Whitespace)
                return false; // ident_op_ is not candidate for command
        }
        return true;
    }
    isAssignment(): boolean {
        // Scan forward until we find a semicolon, newline, unescaped comma
        let paren_depth = 0;
        let wing_depth = 0;
        let brk_depth = 0;
        let scan = this.pos;
        while ((scan < this.tokens.length) &&
            (this.tokens[scan].kind !== AST.SyntaxKind.SemiColonToken) &&
            (this.tokens[scan].kind !== AST.SyntaxKind.Comment) &&
            (this.tokens[scan].kind !== AST.SyntaxKind.NewlineToken) &&
            (this.tokens[scan].kind !== AST.SyntaxKind.EndOfTextToken) &&
            (!((this.tokens[scan].kind === AST.SyntaxKind.CommaToken) &&
                (paren_depth === 0) && (wing_depth === 0) && (brk_depth === 0)))) {
            if (this.tokens[scan].kind === AST.SyntaxKind.LeftParenthesisToken)
                paren_depth++;
            if (this.tokens[scan].kind === AST.SyntaxKind.RightParenthesisToken)
                paren_depth--;
            if (this.tokens[scan].kind === AST.SyntaxKind.LeftWingToken)
                wing_depth++;
            if (this.tokens[scan].kind === AST.SyntaxKind.RightWingToken)
                wing_depth--;
            if (this.tokens[scan].kind === AST.SyntaxKind.LeftBracketToken)
                brk_depth++;
            if (this.tokens[scan].kind === AST.SyntaxKind.RightBracketToken)
                brk_depth--;
            if (this.tokens[scan].kind === AST.SyntaxKind.EqualsToken)
                return true;
            scan++;
        }
        return false;
    }
    commandStatement(): AST.CommandStatement {
        let func = this.identifier(); // Get the function name
        // Scan forward until we find an unescaped comma or comment or
        // semicolon
        // FIXME - need to clean this up
        let brk_depth = 0;
        let wing_depth = 0;
        let paren_depth = 0;
        let scan = this.pos;
        while ((scan < this.tokens.length) &&
            (this.tokens[scan].kind !== AST.SyntaxKind.SemiColonToken) &&
            (this.tokens[scan].kind !== AST.SyntaxKind.Comment) &&
            (this.tokens[scan].kind !== AST.SyntaxKind.NewlineToken) &&
            (this.tokens[scan].kind !== AST.SyntaxKind.EndOfTextToken) &&
            (!((this.tokens[scan].kind === AST.SyntaxKind.CommaToken) &&
                (paren_depth === 0) && (wing_depth === 0) && (brk_depth === 0)))) {
            if (this.tokens[scan].kind === AST.SyntaxKind.LeftParenthesisToken)
                paren_depth++;
            if (this.tokens[scan].kind === AST.SyntaxKind.RightParenthesisToken)
                paren_depth--;
            if (this.tokens[scan].kind === AST.SyntaxKind.LeftWingToken)
                wing_depth++;
            if (this.tokens[scan].kind === AST.SyntaxKind.RightWingToken)
                wing_depth--;
            if (this.tokens[scan].kind === AST.SyntaxKind.LeftBracketToken)
                brk_depth++;
            if (this.tokens[scan].kind === AST.SyntaxKind.RightBracketToken)
                brk_depth--;
            scan++;
        }
        // scan points to the end of the statement.
        // Pass through all the pieces and convert to strings
        let args: AST.Blob[] = [];
        let i = this.pos;
        let blob: AST.Blob = {
            kind: AST.SyntaxKind.Blob,
            text: '',
            pos: 0,
            end: 0
        }
        while (i < scan) {
            let token = this.tokens[i];
            if (token.kind !== AST.SyntaxKind.Whitespace) {
                blob = this.mergeBlob(blob, token);
            } else {
                args.push(blob);
                blob = {
                    kind: AST.SyntaxKind.Blob,
                    text: '',
                    pos: 0,
                    end: 0
                }
            }
            i++;
        }
        if (blob.text !== '') args.push(blob);
        this.pos = scan;
        let ret: AST.CommandStatement = {
            kind: AST.SyntaxKind.CommandStatement,
            func: func,
            args: args,
            pos: func.pos,
            end: args[args.length - 1].end
        }
        return ret;
    }
    multiassignmentStatement(): AST.MultiAssignmentStatement {
        let lbracket = this.expect(AST.SyntaxKind.LeftBracketToken);
        let lhs: AST.VariableDereference[] = [];
        while (!this.isKind(AST.SyntaxKind.RightBracketToken)) {
            lhs.push(this.variableDereference());
            if (this.isKind(AST.SyntaxKind.CommaToken))
                this.consume();
        }
        this.expect(AST.SyntaxKind.RightBracketToken);
        this.munchWhiteSpace();
        this.expect(AST.SyntaxKind.EqualsToken);
        this.munchWhiteSpace();
        let expr = this.expression();
        let ret: AST.MultiAssignmentStatement = {
            kind: AST.SyntaxKind.MultiAssignmentStatement,
            lhs: lhs,
            expression: expr,
            pos: lbracket.pos,
            end: expr.end
        };
        return ret;
    }
    assignmentStatement(): AST.AssignmentStatement | AST.MultiAssignmentStatement {
        this.munchWhiteSpace();
        if (this.isKind(AST.SyntaxKind.LeftBracketToken))
            return this.multiassignmentStatement();
        let lhs = this.variableDereference();
        this.munchWhiteSpace();
        this.expect(AST.SyntaxKind.EqualsToken);
        this.munchWhiteSpace();
        let rhs = this.expression();
        let ret: AST.AssignmentStatement = {
            kind: AST.SyntaxKind.AssignmentStatement,
            lhs: lhs,
            expression: rhs,
            pos: lhs.pos,
            end: rhs.end
        };
        return ret;
    }
    whileStatement(): AST.WhileStatement {
        let while_t = this.expect(AST.SyntaxKind.WhileToken);
        this.munchWhiteSpace();
        let wexpr = this.expression();
        this.statementSep();
        let body = this.block();
        let end_t = this.expect(AST.SyntaxKind.EndToken);
        let ret: AST.WhileStatement = {
            kind: AST.SyntaxKind.WhileStatement,
            expression: wexpr,
            body: body,
            pos: while_t.pos,
            end: end_t.end
        };
        return ret;
    }
    ifStatement(): AST.IfStatement {
        let if_t = this.expect(AST.SyntaxKind.IfToken);
        this.munchWhiteSpace();
        let expr = this.expression();
        let true_block = this.block();
        let elifs: AST.ElseIfStatement[] = [];
        while (this.isKind(AST.SyntaxKind.ElseIfToken)) {
            elifs.push(this.elseIfStatement());
        }
        let els: AST.ElseStatement | undefined;
        if (this.isKind(AST.SyntaxKind.ElseToken))
            els = this.elseStatement();
        let end_t = this.expect(AST.SyntaxKind.EndToken);
        let ret: AST.IfStatement = {
            kind: AST.SyntaxKind.IfStatement,
            expression: expr,
            body: true_block,
            elifs: elifs,
            els: els,
            pos: if_t.pos,
            end: end_t.end
        };
        return ret;
    }
    elseIfStatement(): AST.ElseIfStatement {
        let elseif_t = this.expect(AST.SyntaxKind.ElseIfToken);
        this.munchWhiteSpace();
        let expr = this.expression();
        let true_block = this.block();
        let ret: AST.ElseIfStatement = {
            kind: AST.SyntaxKind.ElseIfStatement,
            expression: expr,
            body: true_block,
            pos: elseif_t.pos,
            end: true_block.end
        };
        return ret;
    }
    elseStatement(): AST.ElseStatement {
        let else_t = this.expect(AST.SyntaxKind.ElseToken);
        let true_block = this.block();
        let ret: AST.ElseStatement = {
            kind: AST.SyntaxKind.ElseStatement,
            body: true_block,
            pos: else_t.pos,
            end: true_block.end
        };
        return ret;
    }
    emptyStatement(): AST.EmptyStatement {
        let ret: AST.EmptyStatement = {
            kind: AST.SyntaxKind.EmptyStatementToken,
            pos: this.token().pos,
            end: this.token().pos
        };
        return ret;
    }
    forStatement(): AST.ForStatement {
        let for_t = this.expect(AST.SyntaxKind.ForToken);
        this.munchWhiteSpace();
        let expr = this.forExpression();
        this.statementSep();
        let body = this.block();
        this.expect(AST.SyntaxKind.EndToken);
        let ret: AST.ForStatement = {
            kind: AST.SyntaxKind.ForStatement,
            expression: expr,
            body: body,
            pos: for_t.pos,
            end: body.end
        }
        return ret;
    }
    forExpression(): AST.ForExpression {
        let paren_block = false;
        if (this.isKind(AST.SyntaxKind.LeftParenthesisToken)) {
            this.expect(AST.SyntaxKind.LeftParenthesisToken);
            paren_block = true;
            this.munchWhiteSpace();
        }
        let id = this.identifier();
        this.munchWhiteSpace();
        this.expect(AST.SyntaxKind.EqualsToken);
        let expr = this.expression();
        if (paren_block) {
            this.munchWhiteSpace();
            this.expect(AST.SyntaxKind.RightParenthesisToken);
        }
        let ret: AST.ForExpression = {
            kind: AST.SyntaxKind.ForExpression,
            identifier: id,
            expression: expr,
            pos: id.pos,
            end: expr.end
        }
        return ret;
    }
    statementSep(): boolean {
        this.munchWhiteSpace();
        let isquiet: boolean = false;
        if (this.isKind(AST.SyntaxKind.Comment) ||
            this.isKind(AST.SyntaxKind.SemiColonToken) ||
            this.isKind(AST.SyntaxKind.NewlineToken) ||
            this.isKind(AST.SyntaxKind.CommaToken)) {
            if (this.isKind(AST.SyntaxKind.SemiColonToken))
                isquiet = true;
            this.consume();
        }
        if (this.isKind(AST.SyntaxKind.ContinueToken)) {
            this.consume();
            return this.statementSep();
        }
        this.munchWhiteSpace();
        if (this.isKind(AST.SyntaxKind.Comment))
            this.consume();
        return isquiet;
    }
    identifier(): AST.Identifier {
        let id = this.expect(AST.SyntaxKind.Identifier);
        this.munchWhiteSpace();
        return (id as AST.Identifier);
    }
    expression(): AST.Expression {
        return this.exp(0, false);
    }
    exp(p: number, in_bracket: boolean): AST.Expression {
        let t: AST.Expression = this.primaryExpression(in_bracket);
        if (!in_bracket && this.isKind(AST.SyntaxKind.Whitespace)) this.munchWhiteSpace();
        // If we see a space, and the next operator is binary only, consume it
        if (this.isKind(AST.SyntaxKind.Whitespace) && operator_table.has(this.next().kind) &&
            !is_unary(this.next().kind)) this.munchWhiteSpace();
        // If we see a space, and the next operator is ambiguous and it is followed
        // by a space, then consume the space (only inside a bracket definition)
        // This rule is to ensure that [1 + 2] --> [3], not [1,2]
        if (this.isKind(AST.SyntaxKind.Whitespace) && operator_table.has(this.next().kind) &&
            is_unary(this.next().kind) && (this.next(2).kind == AST.SyntaxKind.Whitespace) &&
            in_bracket) this.munchWhiteSpace();
        while (operator_table.has(this.token().kind) &&
            ((operator_table.get(this.token().kind) as OperatorDetails).precedence >= p)) {
            let opr_save = this.token();
            let op_info: OperatorDetails =
                operator_table.get(opr_save.kind) as OperatorDetails;
            this.consume();
            // Binary operators (which we must have at this point), consume whitespace.
            this.munchWhiteSpace();
            let q = 1 + op_info.precedence;
            if (op_info.optype == OpType.Postfix) {
                let root: AST.PostfixExpression = {
                    kind: AST.SyntaxKind.PostfixExpression,
                    operator: opr_save as (AST.TransposeToken | AST.HermitianToken),
                    operand: t,
                    pos: t.pos,
                    end: opr_save.end
                }
                t = root;
            } else {
                let t1 = this.exp(q, in_bracket);
                let root: AST.InfixExpression = {
                    kind: AST.SyntaxKind.InfixExpression,
                    leftOperand: t,
                    operator: opr_save as AST.BinaryOperator,
                    rightOperand: t1,
                    pos: t.pos,
                    end: t1.end
                }
                t = root;
            }
        }
        return t;
    }
    variableDereference(): AST.VariableDereference {
        let ident = this.identifier();
        let index = this.indexingExpressions();
        let ret: AST.VariableDereference = {
            kind: AST.SyntaxKind.VariableDereference,
            identifier: ident,
            deref: index,
            pos: ident.pos,
            end: (index.length > 0) ? index[index.length - 1].end : ident.end,
        };
        return ret;
    }
    primaryExpression(in_bracket: boolean): AST.Expression {
        // Simplified version for now...
        if (this.isSpacing() && is_unary(this.next().kind)) {
            this.munchWhiteSpace();
            return this.primaryExpression(in_bracket);
        }
        if (is_unary(this.token().kind)) {
            let op = unary_table.get(this.token().kind) as OperatorDetails;
            let tok = this.token();
            this.consume();
            this.munchWhiteSpace();
            let ret: AST.UnaryExpression = {
                kind: AST.SyntaxKind.PrefixExpression,
                operator: op.mapped_operator!,
                pos: tok.pos,
                end: tok.end,
                operand: this.exp(op.precedence, in_bracket)
            }
            return ret;
        }
        if (this.isKind(AST.SyntaxKind.LeftParenthesisToken)) {
            this.expect(AST.SyntaxKind.LeftParenthesisToken);
            let ret = this.exp(0, in_bracket);
            this.expect(AST.SyntaxKind.RightParenthesisToken);
            return ret;
        }
        if (this.isKind(AST.SyntaxKind.LeftBracketToken)) {
            return this.matrixDefinition(AST.SyntaxKind.RightBracketToken, AST.SyntaxKind.MatrixDefinition);
        }
        if (this.isKind(AST.SyntaxKind.LeftWingToken)) {
            return this.matrixDefinition(AST.SyntaxKind.RightWingToken, AST.SyntaxKind.CellDefinition);
        }
        if (this.isKind(AST.SyntaxKind.FloatLiteral) ||
            this.isKind(AST.SyntaxKind.StringLiteral)) {
            let ret = this.token();
            this.consume();
            return ret;
        }
        if (this.isKind(AST.SyntaxKind.Identifier)) {
            return this.variableDereference();
        }
        console.log(this.tokens);
        console.log("current:", this.pos);
        console.log("token:", this.tokens[this.pos]);
        console.log("kind:", AST.SyntaxKind[this.tokens[this.pos].kind]);
        throw new Error("Parse error");
    }
    indexingExpressions(): AST.DereferenceExpression[] {
        let deref: boolean = true;
        let exprs: AST.DereferenceExpression[] = [];
        while (deref) {
            if (this.isKind(AST.SyntaxKind.LeftParenthesisToken)) {
                exprs.push(this.arrayIndexExpression());
            } else if (this.isKind(AST.SyntaxKind.LeftWingToken)) {
                exprs.push(this.cellIndexExpression());
            } else if (this.isKind(AST.SyntaxKind.DotToken)) {
                exprs.push(this.dotExpression());
            } else {
                deref = false;
            }
            this.munchWhiteSpace();
        }
        return exprs;
    }
    dotExpression(): AST.DotFieldExpression | AST.FieldExpression {
        let dot = this.expect(AST.SyntaxKind.DotToken);
        if (this.isKind(AST.SyntaxKind.LeftParenthesisToken)) {
            this.consume();
            let expression = this.expression();
            let right = this.expect(AST.SyntaxKind.RightParenthesisToken);
            let ret: AST.DotFieldExpression = {
                kind: AST.SyntaxKind.DynamicFieldExpression,
                expression: expression,
                pos: dot.pos,
                end: right.end
            }
            return ret;
        } else {
            let identifier = this.identifier();
            let ret: AST.FieldExpression = {
                kind: AST.SyntaxKind.FieldExpression,
                identifier: identifier,
                pos: dot.pos,
                end: identifier.end
            }
            return ret;
        }
    }
    matrixDefinition(closer: AST.SyntaxKind.RightBracketToken | AST.SyntaxKind.RightWingToken,
        kind: AST.SyntaxKind.MatrixDefinition | AST.SyntaxKind.CellDefinition):
        AST.MatrixDefinition {
        let left = this.consume();
        this.munchWhiteSpace();
        let expressions: AST.Expression[][] = [];
        while (!this.isKind(closer)) {
            let rowdef: AST.Expression[] = [];
            while (!this.isKind(AST.SyntaxKind.SemiColonToken) &&
                !this.isKind(AST.SyntaxKind.NewlineToken) &&
                !this.isKind(closer)) {
                rowdef.push(this.exp(0, true));
                if (this.isKind(AST.SyntaxKind.CommaToken))
                    this.consume();
                this.munchWhiteSpace();
            }
            if (this.isKind(AST.SyntaxKind.SemiColonToken) ||
                this.isKind(AST.SyntaxKind.NewlineToken))
                this.consume();
            this.munchWhiteSpace();
            expressions.push(rowdef);
        }
        let right = this.expect(closer);
        let ret: AST.MatrixDefinition = {
            kind: kind,
            expressions: expressions,
            pos: left.pos,
            end: right.end
        }
        return ret;
    }
    arrayIndexExpression(): AST.ArrayIndexExpression {
        let left = this.expect(AST.SyntaxKind.LeftParenthesisToken);
        let children: AST.Expression[] = [];
        while (!this.isKind(AST.SyntaxKind.RightParenthesisToken)) {
            if (this.isKind(AST.SyntaxKind.ColonToken)) {
                children.push(this.token());
                this.consume();
            } else {
                children.push(this.expression());
            }
            if (!this.isKind(AST.SyntaxKind.RightParenthesisToken))
                this.expect(AST.SyntaxKind.CommaToken);
        }
        let right = this.expect(AST.SyntaxKind.RightParenthesisToken);
        let ret: AST.ArrayIndexExpression = {
            kind: AST.SyntaxKind.ArrayIndexExpression,
            pos: left.pos,
            end: right.end,
            expressions: children
        }
        return ret;
    }
    cellIndexExpression(): AST.CellIndexExpression {
        let left = this.expect(AST.SyntaxKind.LeftWingToken);
        let children: AST.Expression[] = [];
        while (!this.isKind(AST.SyntaxKind.RightWingToken)) {
            if (this.isKind(AST.SyntaxKind.ColonToken)) {
                children.push(this.token());
                this.consume();
            } else {
                children.push(this.expression());
            }
            if (!this.isKind(AST.SyntaxKind.RightWingToken))
                this.expect(AST.SyntaxKind.CommaToken);
        }
        let right = this.expect(AST.SyntaxKind.RightWingToken);
        let ret: AST.CellIndexExpression = {
            kind: AST.SyntaxKind.CellIndexExpression,
            pos: left.pos,
            end: right.end,
            expressions: children
        }
        return ret;
    }
}

