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

interface UnaryOperatorDetails {
    precedence: number,
    mapped_operator: AST.UnaryOperator
};

interface OperatorDetails {
    precedence: number,
    right_associative: boolean,
};

const unary_table = new Map<AST.SyntaxKind, UnaryOperatorDetails>([
    [AST.SyntaxKind.PlusToken, { precedence: 9, mapped_operator: AST.SyntaxKind.UnaryPlusToken }],
    [AST.SyntaxKind.MinusToken, { precedence: 9, mapped_operator: AST.SyntaxKind.UnaryMinusToken }],
    [AST.SyntaxKind.NotToken, { precedence: 9, mapped_operator: AST.SyntaxKind.NotToken }]
]);

const operator_table = new Map<AST.SyntaxKind, OperatorDetails>([
    [AST.SyntaxKind.OrOrToken, { precedence: 1, right_associative: false }],
    [AST.SyntaxKind.AndAndToken, { precedence: 2, right_associative: false }],
    [AST.SyntaxKind.OrToken, { precedence: 3, right_associative: false }],
    [AST.SyntaxKind.AndToken, { precedence: 4, right_associative: false }],
    [AST.SyntaxKind.LessThanToken, { precedence: 5, right_associative: false }],
    [AST.SyntaxKind.GreaterThanToken, { precedence: 5, right_associative: false }],
    [AST.SyntaxKind.LessEqualsToken, { precedence: 5, right_associative: false }],
    [AST.SyntaxKind.GreaterEqualsToken, { precedence: 5, right_associative: false }],
    [AST.SyntaxKind.EqualsEqualsToken, { precedence: 5, right_associative: false }],
    [AST.SyntaxKind.NotEqualsToken, { precedence: 5, right_associative: false }],
    [AST.SyntaxKind.ColonToken, { precedence: 6, right_associative: false }],
    [AST.SyntaxKind.PlusToken, { precedence: 7, right_associative: false }],
    [AST.SyntaxKind.MinusToken, { precedence: 7, right_associative: false }],
    [AST.SyntaxKind.TimesToken, { precedence: 8, right_associative: false }],
    [AST.SyntaxKind.RightDivideToken, { precedence: 8, right_associative: false }],
    [AST.SyntaxKind.LeftDivideToken, { precedence: 8, right_associative: false }],
    [AST.SyntaxKind.DotTimesToken, { precedence: 8, right_associative: false }],
    [AST.SyntaxKind.DotRightDivideToken, { precedence: 8, right_associative: false }],
    [AST.SyntaxKind.DotLeftDivideToken, { precedence: 8, right_associative: false }],
    [AST.SyntaxKind.NotToken, { precedence: 9, right_associative: false }],
    [AST.SyntaxKind.PowerToken, { precedence: 10, right_associative: true }],
    [AST.SyntaxKind.DotPowerToken, { precedence: 10, right_associative: true }]
]);

export class Parser {
    readonly tokens: AST.Node[];
    pos: number;
    constructor(tok: AST.Node[]) {
        this.tokens = tok;
        this.pos = 0;
    }
    expect(kind: AST.SyntaxKind): AST.Node {
        let current = this.token();
        if (this.isKind(kind)) {
            this.pos++;
        } else throw new Error("Parse error");
        console.log("Consumed token: ", AST.SyntaxKind[kind]);
        return current;
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
    munchWhiteSpace(): void {
        while (this.isSpacing()) this.pos++;
    }
    block(): AST.Block {
        let statements: AST.Statement[] = [];
        let more: boolean = true;
        while (more) {
            this.munchWhiteSpace();
            if (!this.isEndOfText() && !this.isKind(AST.SyntaxKind.EndToken)) {
                let statement = this.statement();
                statement.printit = this.statementSep();
                statements.push(statement);
            }
            more = !this.isEndOfText() && !this.isKind(AST.SyntaxKind.EndToken);
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
        if (this.isKind(AST.SyntaxKind.ThrowToken))
            return this.throwStatement();
        if (this.isKind(AST.SyntaxKind.ReturnToken))
            return this.singletonStatement(AST.SyntaxKind.ReturnStatement);
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
        return this.expression();
    }
    singletonStatement(kind: AST.Singleton): AST.SingletonStatement {
        let tok = this.token();
        this.pos++;
        let ret: AST.SingletonStatement = {
            kind: kind,
            pos: tok.pos,
            end: tok.end
        };
        return ret;
    }
    isAssignment(): boolean {
        // Scan forward until we find a semicolon, newline, unescaped comma
        let paren_depth = 0;
        let wing_depth = 0;
        let scan = this.pos;
        while ((scan < this.tokens.length) &&
            (this.tokens[scan].kind !== AST.SyntaxKind.SemiColonToken) &&
            (this.tokens[scan].kind !== AST.SyntaxKind.Comment) &&
            (this.tokens[scan].kind !== AST.SyntaxKind.NewlineToken) &&
            (!((this.tokens[scan].kind === AST.SyntaxKind.CommaToken) &&
                (paren_depth === 0) && (wing_depth === 0)))) {
            if (this.tokens[scan].kind === AST.SyntaxKind.LeftParenthesisToken)
                paren_depth++;
            if (this.tokens[scan].kind === AST.SyntaxKind.RightParenthesisToken)
                paren_depth--;
            if (this.tokens[scan].kind === AST.SyntaxKind.LeftWingToken)
                wing_depth++;
            if (this.tokens[scan].kind === AST.SyntaxKind.RightWingToken)
                wing_depth--;
            if (this.tokens[scan].kind === AST.SyntaxKind.EqualsToken)
                return true;
            scan++;
        }
        return false;
    }
    assignmentStatement(): AST.AssignmentStatement {
        this.expect(AST.SyntaxKind.EqualsToken);
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
        let id = this.identifier();
        this.munchWhiteSpace();
        this.expect(AST.SyntaxKind.EqualsToken);
        let expr = this.expression();
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
            this.pos++;
        }
        if (this.isKind(AST.SyntaxKind.ContinueToken)) {
            this.pos++;
            return this.statementSep();
        }
        this.munchWhiteSpace();
        if (this.isKind(AST.SyntaxKind.Comment)) this.pos++;
        return isquiet;
    }
    identifier(): AST.Identifier {
        let id = this.expect(AST.SyntaxKind.Identifier);
        this.munchWhiteSpace();
        return (id as AST.Identifier);
    }
    expression(): AST.Expression {
        return this.exp(0);
    }
    exp(p: number): AST.Expression {
        let t: AST.Expression = this.primaryExpression();
        while (operator_table.has(this.token().kind) &&
            ((operator_table.get(this.token().kind) as OperatorDetails).precedence >= p)) {
            let opr_save = this.token();
            let op_info: OperatorDetails =
                operator_table.get(opr_save.kind) as OperatorDetails;
            this.pos++;
            this.munchWhiteSpace();
            let q: number = 0;
            if (op_info.right_associative)
                q = op_info.precedence;
            else
                q = 1 + op_info.precedence;
            let t1 = this.exp(q);
            t = <AST.InfixExpression>{
                kind: AST.SyntaxKind.InfixExpression,
                leftOperand: t,
                operator: opr_save,
                rightOperand: t1
            }
        }
        return t;
    }
    variableDereference(): AST.Expression {
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
    primaryExpression(): AST.Expression {
        // Simplified version for now...
        if (unary_table.has(this.token().kind)) {
            let op: UnaryOperatorDetails =
                unary_table.get(this.token().kind) as UnaryOperatorDetails;
            let tok = this.token();
            this.pos++;
            this.munchWhiteSpace();
            let ret: AST.UnaryExpression = {
                kind: op.mapped_operator,
                pos: tok.pos,
                end: tok.end,
                operand: this.exp(op.precedence)
            }
            return ret;
        }
        if (this.isKind(AST.SyntaxKind.LeftParenthesisToken)) {
            this.pos++;
            let ret = this.exp(0);
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
            this.pos++;
            return ret;
        }
        if (this.isKind(AST.SyntaxKind.Identifier)) {
            return this.variableDereference();
        }
        return {
            kind: AST.SyntaxKind.Unknown,
            pos: 0,
            end: 0
        };
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
        }
        return exprs;
    }
    dotExpression(): AST.DotFieldExpression | AST.FieldExpression {
        let dot = this.expect(AST.SyntaxKind.DotToken);
        if (this.isKind(AST.SyntaxKind.LeftParenthesisToken)) {
            this.expect(AST.SyntaxKind.LeftParenthesisToken);
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
        let left = this.token();
        this.pos++;
        this.munchWhiteSpace();
        let expressions: AST.Expression[][] = [];
        while (!this.isKind(closer)) {
            let rowdef: AST.Expression[] = [];
            while (!this.isKind(AST.SyntaxKind.SemiColonToken) &&
                !this.isKind(AST.SyntaxKind.NewlineToken) &&
                !this.isKind(closer)) {
                rowdef.push(this.expression());
                if (this.isKind(AST.SyntaxKind.CommaToken))
                    this.pos++;
                this.munchWhiteSpace();
            }
            if (this.isKind(AST.SyntaxKind.SemiColonToken) ||
                this.isKind(AST.SyntaxKind.NewlineToken)) this.pos++;
            this.munchWhiteSpace();
            expressions.push(rowdef);
        }
        let right = this.expect(AST.SyntaxKind.RightBracketToken);
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
                this.pos++;
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
                this.pos++;
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
