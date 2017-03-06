import * as AST from './ast';
import { inspect } from 'util';

function WriteExpressionList(expr: AST.Expression[]): string {
    return expr.map(WriteExpression).join(',');
}

function WriteArrayIndexExpression(tree: AST.ArrayIndexExpression): string {
    return '(' + WriteExpressionList(tree.expressions) + ')';
}

function WriteCellIndexExpression(tree: AST.CellIndexExpression): string {
    return '{' + WriteExpressionList(tree.expressions) + '}';
}

function WriteFieldExpression(tree: AST.FieldExpression): string {
    return "." + tree.identifier.name;
}

function WriteDotFieldExpression(tree: AST.DotFieldExpression): string {
    return ".(" + WriteExpression(tree.expression) + ")";
}

function WriteDereferenceExpression(tree: AST.DereferenceExpression): string {
    switch (tree.kind) {
        case AST.SyntaxKind.ArrayIndexExpression:
            return WriteArrayIndexExpression(tree as AST.ArrayIndexExpression);
        case AST.SyntaxKind.CellIndexExpression:
            return WriteCellIndexExpression(tree as AST.CellIndexExpression);
        case AST.SyntaxKind.FieldExpression:
            return WriteFieldExpression(tree as AST.FieldExpression);
        case AST.SyntaxKind.DynamicFieldExpression:
            return WriteDotFieldExpression(tree as AST.DotFieldExpression);
    }
}

function WriteVariableDereference(tree: AST.VariableDereference): string {
    let ret = tree.identifier.name;
    ret += tree.deref.map(WriteDereferenceExpression).join('');
    return ret;
}

function OperatorName(op: AST.BinaryOperator): string {
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

function WriteInfixExpression(tree: AST.InfixExpression): string {
    return '(' + WriteExpression(tree.leftOperand) + ')' +
        OperatorName(tree.operator) + '(' + WriteExpression(tree.rightOperand) + ')';
}

function WritePrefixExpression(tree: AST.UnaryExpression): string {
    switch (tree.operator) {
        case AST.SyntaxKind.UnaryPlusToken:
            return '+' + '(' + WriteExpression(tree.operand) + ')';
        case AST.SyntaxKind.UnaryMinusToken:
            return '-' + '(' + WriteExpression(tree.operand) + ')';
        case AST.SyntaxKind.NotToken:
            return '~' + '(' + WriteExpression(tree.operand) + ')';
    }
}


function WriteMatDefinition(exp: AST.Expression[][], open: string, close: string): string {
    return open +
        exp.map((ex: AST.Expression[]) => {
            return open + WriteExpressionList(ex) + close;
        }).join(',') + close;
}

function WriteMatrixDefinition(tree: AST.MatrixDefinition): string {
    switch (tree.kind) {
        case AST.SyntaxKind.MatrixDefinition:
            return WriteMatDefinition(tree.expressions, '[', ']');
        case AST.SyntaxKind.CellDefinition:
            return WriteMatDefinition(tree.expressions, '{', '}');
    }
}

function WriteFloatLiteral(tree: AST.LiteralExpression): string {
    return tree.text;
}

function WriteIntegerLiteral(tree: AST.LiteralExpression): string {
    return tree.text;
}

function WriteStringLiteral(tree: AST.LiteralExpression): string {
    return tree.text;
}


function WriteExpression(tree: AST.Expression): string {
    switch (tree.kind) {
        case AST.SyntaxKind.InfixExpression:
            return WriteInfixExpression(tree as AST.InfixExpression);
        case AST.SyntaxKind.PrefixExpression:
            return WritePrefixExpression(tree as AST.UnaryExpression);
        case AST.SyntaxKind.VariableDereference:
            return WriteVariableDereference(tree as AST.VariableDereference);
        case AST.SyntaxKind.MatrixDefinition:
            return WriteMatrixDefinition(tree as AST.MatrixDefinition);
        case AST.SyntaxKind.CellDefinition:
            return WriteMatrixDefinition(tree as AST.MatrixDefinition);
        case AST.SyntaxKind.FloatLiteral:
            return WriteFloatLiteral(tree as AST.LiteralExpression);
        case AST.SyntaxKind.IntegerLiteral:
            return WriteIntegerLiteral(tree as AST.LiteralExpression);
        case AST.SyntaxKind.StringLiteral:
            return WriteStringLiteral(tree as AST.LiteralExpression);
        default:
            throw new Error('unexpected expression type ' + inspect(tree));
    }
}

function WriteAssignmentStatement(tree: AST.AssignmentStatement): string {
    let ret = WriteVariableDereference(tree.lhs);
    ret += ' = ';
    ret += WriteExpression(tree.expression);
    return ret;
}

function WriteForStatement(tree: AST.ForStatement): string {
    let ret = 'for ' + tree.expression.identifier.name + ' = ' + WriteExpression(tree.expression.expression) + '\n';
    ret += WriteBlock(tree.body);
    ret += 'end\n';
    return ret;
}

function WriteWhileStatement(tree: AST.WhileStatement): string {
    let ret = 'while ' + WriteExpression(tree.expression) + '\n';
    ret += WriteBlock(tree.body);
    ret += 'end\n';
    return ret;
}

function WriteElseStatement(tree: AST.ElseStatement): string {
    let ret = 'else\n';
    ret += WriteBlock(tree.body);
    return ret;
}

function WriteElseIfStatement(tree: AST.ElseIfStatement): string {
    let ret = 'elseif ' + WriteExpression(tree.expression) + '\n';
    ret += WriteBlock(tree.body);
    return ret;
}

function WriteIfStatement(tree: AST.IfStatement): string {
    let ret = 'if ' + WriteExpression(tree.expression) + '\n';
    ret += WriteBlock(tree.body);
    for (let elif of tree.elifs) {
        ret += WriteElseIfStatement(elif as AST.ElseIfStatement);
    }
    if (tree.els)
        ret += WriteElseStatement(tree.els as AST.ElseStatement);
    ret += 'end\n';
    return ret;
}

function WriteExpressionStatement(tree: AST.ExpressionStatement): string {
    return WriteExpression(tree.expression);
}

function WriteCaseStatement(tree: AST.CaseStatement): string {
    let ret = 'case ' + WriteExpression(tree.expression) + '\n';
    ret += WriteBlock(tree.body);
    return ret;
}

function WriteOtherwiseStatement(tree: AST.OtherwiseStatement): string {
    let ret = 'otherwise\n';
    ret += WriteBlock(tree.body);
    return ret;
}

function WriteSwitchStatement(tree: AST.SwitchStatement): string {
    let ret = 'switch ' + WriteExpression(tree.expr) + '\n';
    for (let cse of tree.cases) {
        ret += WriteCaseStatement(cse as AST.CaseStatement);
    }
    if (tree.otherwise)
        ret += WriteOtherwiseStatement(tree.otherwise as AST.OtherwiseStatement);
    ret += 'end\n';
    return ret;
}

function WriteCatchStatement(tree: AST.CatchStatement): string {
    let ret = 'catch ';
    if (tree.identifier)
        ret += tree.identifier.name;
    ret += '\n';
    ret += WriteBlock(tree.body);
    return ret;
}

function WriteTryStatement(tree: AST.TryStatement): string {
    let ret = 'try\n';
    ret += WriteBlock(tree.body);
    if (tree.catc) ret += WriteCatchStatement(tree.catc as AST.CatchStatement);
    ret += 'end\n';
    return ret;
}

function WriteFunctionDefinition(tree: AST.FunctionDef) {
    let ret = 'function ';
}

function WriteStatement(tree: AST.Statement): string {
    let ret: string = '';
    switch (tree.kind) {
        case AST.SyntaxKind.AssignmentStatement:
            ret = WriteAssignmentStatement(tree as AST.AssignmentStatement);
            break;
        case AST.SyntaxKind.FunctionDefinition:
            ret = WriteFunctionDefinition(tree as AST.FunctionDef);
            break;
        case AST.SyntaxKind.ForStatement:
            ret = WriteForStatement(tree as AST.ForStatement);
            break;
        case AST.SyntaxKind.WhileStatement:
            ret = WriteWhileStatement(tree as AST.WhileStatement);
            break;
        case AST.SyntaxKind.ExpressionStatement:
            ret = WriteExpressionStatement(tree as AST.ExpressionStatement);
            break;
        case AST.SyntaxKind.IfStatement:
            ret = WriteIfStatement(tree as AST.IfStatement);
            break;
        case AST.SyntaxKind.SwitchStatement:
            ret = WriteSwitchStatement(tree as AST.SwitchStatement);
            break;
        case AST.SyntaxKind.TryStatement:
            ret = WriteTryStatement(tree as AST.TryStatement);
            break;
    }
    if (!tree.printit) ret += ';'
    ret += '\n';
    return ret;
}

function WriteBlock(tree: AST.Block): string {
    let ret: string = '';
    for (let statement of tree.statements)
        ret += WriteStatement(statement);
    return ret;
}

export default function MWriter(tree: AST.Node): string {
    if (tree.kind === AST.SyntaxKind.Block)
        return WriteBlock(tree as AST.Block);
    return 'unknown\n';
}
