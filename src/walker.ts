import * as AST from './ast';
import { inspect } from 'util';

class DotMWalker {
    txt: string;
    indent: number;
    constructor() {
        this.txt = '';
        this.indent = 0;
    }
    writeExpressionList(expr: AST.Expression[]): string {
        return expr.map((ex) => this.writeExpression(ex)).join(',');
    }
    writeArrayIndexExpression(tree: AST.ArrayIndexExpression): string {
        return '(' + this.writeExpressionList(tree.expressions) + ')';
    }
    writeCellIndexExpression(tree: AST.CellIndexExpression): string {
        return '{' + this.writeExpressionList(tree.expressions) + '}';
    }
    writeFieldExpression(tree: AST.FieldExpression): string {
        return "." + tree.identifier.name;
    }
    writeDotFieldExpression(tree: AST.DotFieldExpression): string {
        return ".(" + this.writeExpression(tree.expression) + ")";
    }
    writeDereferenceExpression(tree: AST.DereferenceExpression): string {
        switch (tree.kind) {
            case AST.SyntaxKind.ArrayIndexExpression:
                return this.writeArrayIndexExpression(tree as AST.ArrayIndexExpression);
            case AST.SyntaxKind.CellIndexExpression:
                return this.writeCellIndexExpression(tree as AST.CellIndexExpression);
            case AST.SyntaxKind.FieldExpression:
                return this.writeFieldExpression(tree as AST.FieldExpression);
            case AST.SyntaxKind.DynamicFieldExpression:
                return this.writeDotFieldExpression(tree as AST.DotFieldExpression);
        }
    }
    writeVariableDereference(tree: AST.VariableDereference): string {
        let ret = tree.identifier.name;
        ret += tree.deref.map((x) => this.writeDereferenceExpression(x)).join('');
        return ret;
    }
    operatorName(op: AST.BinaryOperator): string {
        switch (op.kind) {
            case AST.SyntaxKind.PlusToken: return ('+');
            case AST.SyntaxKind.PowerToken: return ('^');
            case AST.SyntaxKind.DotPowerToken: return ('.^');
            case AST.SyntaxKind.MinusToken: return ('-');
            case AST.SyntaxKind.TimesToken: return ('*');
            case AST.SyntaxKind.DotTimesToken: return ('.*');
            case AST.SyntaxKind.DotLeftDivideToken: return ('.\\');
            case AST.SyntaxKind.DotRightDivideToken: return ('./');
            case AST.SyntaxKind.LeftDivideToken: return ('\\');
            case AST.SyntaxKind.RightDivideToken: return ('/');
            case AST.SyntaxKind.AndAndToken: return ('&&');
            case AST.SyntaxKind.AndToken: return ('&');
            case AST.SyntaxKind.OrOrToken: return ('||');
            case AST.SyntaxKind.OrToken: return ('|');
            case AST.SyntaxKind.LessThanToken: return ('<');
            case AST.SyntaxKind.LessEqualsToken: return ('<=');
            case AST.SyntaxKind.GreaterEqualsToken: return ('>=');
            case AST.SyntaxKind.GreaterThanToken: return ('>');
            case AST.SyntaxKind.EqualsEqualsToken: return ('==');
            case AST.SyntaxKind.NotEqualsToken: return ('~=');
            case AST.SyntaxKind.ColonToken: return (':');
        }
    }
    writeInfixExpression(tree: AST.InfixExpression): string {
        return '(' + this.writeExpression(tree.leftOperand) + ')' +
            this.operatorName(tree.operator) + '(' +
            this.writeExpression(tree.rightOperand) + ')';
    }
    writePrefixExpression(tree: AST.UnaryExpression): string {
        switch (tree.operator) {
            case AST.SyntaxKind.UnaryPlusToken:
                return '+' + '(' + this.writeExpression(tree.operand) + ')';
            case AST.SyntaxKind.UnaryMinusToken:
                return '-' + '(' + this.writeExpression(tree.operand) + ')';
            case AST.SyntaxKind.NotToken:
                return '~' + '(' + this.writeExpression(tree.operand) + ')';
        }
    }
    writeMatDefinition(exp: AST.Expression[][], open: string, close: string): string {
        return open + exp.map((ex) => {
            return this.writeExpressionList(ex);
        }).join(';') + close;
    }
    writeMatrixDefinition(tree: AST.MatrixDefinition): string {
        switch (tree.kind) {
            case AST.SyntaxKind.MatrixDefinition:
                return this.writeMatDefinition(tree.expressions, '[', ']');
            case AST.SyntaxKind.CellDefinition:
                return this.writeMatDefinition(tree.expressions, '{', '}');
        }
    }
    writeFloatLiteral(tree: AST.LiteralExpression): string {
        return tree.text;
    }
    writeIntegerLiteral(tree: AST.LiteralExpression): string {
        return tree.text;
    }
    writeStringLiteral(tree: AST.LiteralExpression): string {
        return tree.text;
    }
    writeExpression(tree: AST.Expression): string {
        switch (tree.kind) {
            case AST.SyntaxKind.InfixExpression:
                return this.writeInfixExpression(tree as AST.InfixExpression);
            case AST.SyntaxKind.PrefixExpression:
                return this.writePrefixExpression(tree as AST.UnaryExpression);
            case AST.SyntaxKind.VariableDereference:
                return this.writeVariableDereference(tree as AST.VariableDereference);
            case AST.SyntaxKind.MatrixDefinition:
                return this.writeMatrixDefinition(tree as AST.MatrixDefinition);
            case AST.SyntaxKind.CellDefinition:
                return this.writeMatrixDefinition(tree as AST.MatrixDefinition);
            case AST.SyntaxKind.FloatLiteral:
                return this.writeFloatLiteral(tree as AST.LiteralExpression);
            case AST.SyntaxKind.IntegerLiteral:
                return this.writeIntegerLiteral(tree as AST.LiteralExpression);
            case AST.SyntaxKind.StringLiteral:
                return this.writeStringLiteral(tree as AST.LiteralExpression);
            default:
                throw new Error('unexpected expression type ' + inspect(tree));
        }
    }
    writeMultiAssignmentStatement(tree: AST.MultiAssignmentStatement): string {
        let ret = '[' + tree.lhs.map((x) => this.writeVariableDereference(x)).join(',') + ']';
        ret += ' = ';
        ret += this.writeExpression(tree.expression);
        return ret;
    }
    writeAssignmentStatement(tree: AST.AssignmentStatement): string {
        let ret = this.writeVariableDereference(tree.lhs);
        ret += ' = ';
        ret += this.writeExpression(tree.expression);
        return ret;
    }
    writeForStatement(tree: AST.ForStatement): string {
        let ret = 'for ' + tree.expression.identifier.name + ' = ' +
            this.writeExpression(tree.expression.expression) + '\n';
        ret += this.writeBlock(tree.body);
        ret += this.pad() + 'end\n';
        return ret;
    }
    writeWhileStatement(tree: AST.WhileStatement): string {
        let ret = 'while ' + this.writeExpression(tree.expression) + '\n';
        ret += this.writeBlock(tree.body);
        ret += this.pad() + 'end\n';
        return ret;
    }
    writeElseStatement(tree: AST.ElseStatement): string {
        let ret = this.pad() + 'else\n';
        ret += this.writeBlock(tree.body);
        return ret;
    }
    writeElseIfStatement(tree: AST.ElseIfStatement): string {
        let ret = this.pad() + 'elseif ' + this.writeExpression(tree.expression) + '\n';
        ret += this.writeBlock(tree.body);
        return ret;
    }
    writeIfStatement(tree: AST.IfStatement): string {
        let ret = 'if ' + this.writeExpression(tree.expression) + '\n';
        ret += this.writeBlock(tree.body);
        for (let elif of tree.elifs) {
            ret += this.writeElseIfStatement(elif as AST.ElseIfStatement);
        }
        if (tree.els)
            ret += this.writeElseStatement(tree.els as AST.ElseStatement);
        ret += this.pad() + 'end\n';
        return ret;
    }
    writeExpressionStatement(tree: AST.ExpressionStatement): string {
        return this.writeExpression(tree.expression);
    }
    writeCaseStatement(tree: AST.CaseStatement): string {
        let ret = this.pad() + 'case ' + this.writeExpression(tree.expression) + '\n';
        ret += this.writeBlock(tree.body);
        return ret;
    }
    writeOtherwiseStatement(tree: AST.OtherwiseStatement): string {
        let ret = this.pad() + 'otherwise\n';
        ret += this.writeBlock(tree.body);
        return ret;
    }
    writeSwitchStatement(tree: AST.SwitchStatement): string {
        let ret = 'switch ' + this.writeExpression(tree.expr) + '\n';
        for (let cse of tree.cases) {
            ret += this.writeCaseStatement(cse as AST.CaseStatement);
        }
        if (tree.otherwise)
            ret += this.writeOtherwiseStatement(tree.otherwise as AST.OtherwiseStatement);
        ret += this.pad() + 'end\n';
        return ret;
    }
    writeCatchStatement(tree: AST.CatchStatement): string {
        let ret = this.pad() + 'catch ';
        if (tree.identifier)
            ret += tree.identifier.name;
        ret += '\n';
        ret += this.writeBlock(tree.body);
        return ret;
    }
    writeTryStatement(tree: AST.TryStatement): string {
        let ret = 'try\n';
        ret += this.writeBlock(tree.body);
        if (tree.catc) ret += this.writeCatchStatement(tree.catc as AST.CatchStatement);
        ret += this.pad() + 'end\n';
        return ret;
    }
    writeIdentifierList(list: AST.Identifier[]) {
        return list.map((a) => a.name).join(',');
    }
    writeFunctionDefinition(tree: AST.FunctionDef) {
        let ret = 'function ';
        if (tree.returns.length) {
            ret += '[' + this.writeIdentifierList(tree.returns) + '] = ';
        }
        ret += tree.name.name;
        if (tree.args.length) {
            ret += '(' + this.writeIdentifierList(tree.args) + ')';
        }
        ret += '\n';
        ret += this.writeBlock(tree.body);
        ret += this.pad() + 'end\n';
        return ret;
    }
    writeCommandStatement(tree: AST.CommandStatement): string {
        let ret: string = 'command ';
        ret += tree.func.name + '(';
        for (let blob of tree.args) {
            ret += "'" + blob.text + "',"
        }
        ret += ')';
        return ret;
    }
    writeStatement(tree: AST.Statement): string {
        let ret: string = '';
        switch (tree.kind) {
            case AST.SyntaxKind.AssignmentStatement:
                ret = this.writeAssignmentStatement(tree as AST.AssignmentStatement);
                break;
            case AST.SyntaxKind.MultiAssignmentStatement:
                ret = this.writeMultiAssignmentStatement(tree as AST.MultiAssignmentStatement);
                break;
            case AST.SyntaxKind.FunctionDefinition:
                ret = this.writeFunctionDefinition(tree as AST.FunctionDef);
                break;
            case AST.SyntaxKind.ForStatement:
                ret = this.writeForStatement(tree as AST.ForStatement);
                break;
            case AST.SyntaxKind.WhileStatement:
                ret = this.writeWhileStatement(tree as AST.WhileStatement);
                break;
            case AST.SyntaxKind.ExpressionStatement:
                ret = this.writeExpressionStatement(tree as AST.ExpressionStatement);
                break;
            case AST.SyntaxKind.IfStatement:
                ret = this.writeIfStatement(tree as AST.IfStatement);
                break;
            case AST.SyntaxKind.SwitchStatement:
                ret = this.writeSwitchStatement(tree as AST.SwitchStatement);
                break;
            case AST.SyntaxKind.TryStatement:
                ret = this.writeTryStatement(tree as AST.TryStatement);
                break;
            case AST.SyntaxKind.CommandStatement:
                ret = this.writeCommandStatement(tree as AST.CommandStatement);
                break;
        }
        if (!tree.printit) ret += ';'
        ret += '\n';
        return ret;
    }
    pad(): string {
        return ' '.repeat(this.indent);
    }
    writeBlock(tree: AST.Block): string {
        this.indent += 3;
        let ret: string = '';
        for (let statement of tree.statements)
            ret += this.pad() + this.writeStatement(statement);
        this.indent -= 3;
        return ret;
    }
}

export default function MWriter(tree: AST.Node): string {
    if (tree.kind === AST.SyntaxKind.Block) {
        let p = new DotMWalker;
        return p.writeBlock(tree as AST.Block);
    }
    return 'unknown\n';
}
