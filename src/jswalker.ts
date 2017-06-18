import * as AST from './ast';
import { inspect } from 'util';


class JSWalker {
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
        return '{type: "array", index: [' + this.writeExpressionList(tree.expressions) + ']}';
    }
    writeCellIndexExpression(tree: AST.CellIndexExpression): string {
        return '{cell: (' + this.writeExpressionList(tree.expressions) + ')}';
    }
    writeFieldExpression(tree: AST.FieldExpression): string {
        return "{field: '" + tree.identifier.name + "'}";
    }
    writeDotFieldExpression(tree: AST.DotFieldExpression): string {
        return "{field: " + this.writeExpression(tree.expression) + "}";
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
        let ret = '$ws.'+tree.identifier.name;
        ret += tree.deref.map((x) => this.writeDereferenceExpression(x)).join('');
        return ret;
    }
    operatorName(op: AST.BinaryOperator): string {
        switch (op.kind) {
            case AST.SyntaxKind.PlusToken: return ('plus');
            case AST.SyntaxKind.PowerToken: return ('mpower');
            case AST.SyntaxKind.DotPowerToken: return ('power');
            case AST.SyntaxKind.MinusToken: return ('minus');
            case AST.SyntaxKind.TimesToken: return ('mtimes');
            case AST.SyntaxKind.DotTimesToken: return ('times');
            case AST.SyntaxKind.DotLeftDivideToken: return ('ldivide');
            case AST.SyntaxKind.DotRightDivideToken: return ('rdivide');
            case AST.SyntaxKind.LeftDivideToken: return ('mldivide');
            case AST.SyntaxKind.RightDivideToken: return ('mrdivide');
            case AST.SyntaxKind.AndAndToken: return ('&&');
            case AST.SyntaxKind.AndToken: return ('&');
            case AST.SyntaxKind.OrOrToken: return ('||');
            case AST.SyntaxKind.OrToken: return ('|');
            case AST.SyntaxKind.LessThanToken: return ('lt');
            case AST.SyntaxKind.LessEqualsToken: return ('le');
            case AST.SyntaxKind.GreaterEqualsToken: return ('ge');
            case AST.SyntaxKind.GreaterThanToken: return ('gt');
            case AST.SyntaxKind.EqualsEqualsToken: return ('eq');
            case AST.SyntaxKind.NotEqualsToken: return ('ne');
            case AST.SyntaxKind.ColonToken: return ('colon');
        }
    }
    writeInfixExpression(tree: AST.InfixExpression): string {
        return '$ws.'+this.operatorName(tree.operator) + '(' +
            this.writeExpression(tree.leftOperand) + ',' +
            this.writeExpression(tree.rightOperand) + ')';
    }
    writePostfixExpression(tree: AST.PostfixExpression): string {
        switch (tree.operator.kind) {
            case AST.SyntaxKind.TransposeToken:
                return '$ws.transpose(' + this.writeExpression(tree.operand) + ')';
            case AST.SyntaxKind.HermitianToken:
                return '$ws.hermitian(' + this.writeExpression(tree.operand) + ')';
        }
    }
    writePrefixExpression(tree: AST.UnaryExpression): string {
        switch (tree.operator) {
            case AST.SyntaxKind.UnaryPlusToken:
                return '$ws.pos(' + this.writeExpression(tree.operand) + ')';
            case AST.SyntaxKind.UnaryMinusToken:
                return '$ws.neg(' + this.writeExpression(tree.operand) + ')';
            case AST.SyntaxKind.NotToken:
                return '$ws.not(' + this.writeExpression(tree.operand) + ')';
        }
    }
    writeMatDefinition(exp: AST.Expression[][], open: string, close: string): string {
        return open + exp.map((ex) => {
            return '$ws.ncat([' + this.writeExpressionList(ex) + '],1)';
        }).join(',') + close;
    }
    writeMatrixDefinition(tree: AST.MatrixDefinition): string {
        switch (tree.kind) {
            case AST.SyntaxKind.MatrixDefinition:
                return this.writeMatDefinition(tree.expressions, '$ws.ncat([', '],0)');
            case AST.SyntaxKind.CellDefinition:
                return this.writeMatDefinition(tree.expressions, '{', '}');
        }
    }
    writeFloatLiteral(tree: AST.LiteralExpression): string {
        return '$ws.mks(' + tree.text + ')';
    }
    writeIntegerLiteral(tree: AST.LiteralExpression): string {
        return '$ws.mks(' + tree.text + ')';
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
            case AST.SyntaxKind.PostfixExpression:
                return this.writePostfixExpression(tree as AST.PostfixExpression);
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
    writeStraightAssignmentStatement(tree: AST.AssignmentStatement): string {
        let ret = '$ws.' + tree.lhs.identifier.name + ' = ';
        ret += this.writeExpression(tree.expression);
        if (tree.printit)
            ret += '\n$ws.console.log($ws.' + tree.lhs.identifier.name + ')';
        return ret;
    }
    writeAssignmentStatement(tree: AST.AssignmentStatement): string {
        if (tree.lhs.deref.length === 0)
            return this.writeStraightAssignmentStatement(tree);
        let ret = '$ws.' + tree.lhs.identifier.name + ' = Set($ws.' + tree.lhs.identifier.name;
        ret += ',' + '[' + tree.lhs.deref.map((x) => this.writeDereferenceExpression(x)).join(',') + '],';
        ret += this.writeExpression(tree.expression) + ')';
        if (tree.printit)
            ret += '\n$ws.console.log($ws.' + tree.lhs.identifier.name + ')';
        return ret;
    }
    writeColonForStatement(tree: AST.ForStatement): string {
        const ident = tree.expression.identifier.name;
        const colon = tree.expression.expression as AST.InfixExpression;
        let ret = 'let $' + ident + ' = new $ws.ColonGenerator(' +
            '$ws.sv(' + this.writeExpression(colon.leftOperand) + ')' +
            ',1,' +
            '$ws.sv(' + this.writeExpression(colon.rightOperand) + '));\n';
        ret += 'while (!$' + ident + '.done()) {\n';
        ret += `$${ident}.next();\n`;
        //ret += `    $ws.${ident} = $${ident}.next();\n`;
        ret += '}';
        return ret;
        ret += '  let ' + ident + ' = mks($' + ident + '.next());\n';
        ret += this.writeBlock(tree.body);
        ret += '}';
        return ret;
    }
    writeForStatement(tree: AST.ForStatement): string {
        if ((tree.expression.expression.kind === AST.SyntaxKind.InfixExpression) &&
            (tree.expression.expression.operator.kind === AST.SyntaxKind.ColonToken))
            return this.writeColonForStatement(tree);
        let ret = 'for ' + tree.expression.identifier.name + ' = ' +
            this.writeExpression(tree.expression.expression) + '\n';
        ret += this.writeBlock(tree.body);
        return ret;
    }
    writeWhileStatement(tree: AST.WhileStatement): string {
        let ret = 'while ($ws.rnaz(' + this.writeExpression(tree.expression) + '))\n';
        ret += this.writeBlock(tree.body);
        return ret;
    }
    writeElseStatement(tree: AST.ElseStatement): string {
        let ret = this.pad() + 'else\n';
        ret += this.writeBlock(tree.body);
        return ret;
    }
    writeElseIfStatement(tree: AST.ElseIfStatement): string {
        let ret = this.pad() + 'else if ($ws.rnaz(' + this.writeExpression(tree.expression) + '))\n';
        ret += this.writeBlock(tree.body);
        return ret;
    }
    writeIfStatement(tree: AST.IfStatement): string {
        let ret = 'if ($ws.rnaz(' + this.writeExpression(tree.expression) + '))\n';
        ret += this.writeBlock(tree.body);
        for (let elif of tree.elifs) {
            ret += this.writeElseIfStatement(elif as AST.ElseIfStatement);
        }
        if (tree.els)
            ret += this.writeElseStatement(tree.els as AST.ElseStatement);
        return ret;
    }
    writeExpressionStatement(tree: AST.ExpressionStatement): string {
        let ret = this.writeExpression(tree.expression);
        if (tree.printit)
            ret = '$ws.console.log(' + ret + ')';
        return ret;
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
        return ret;
    }
    writeCommandStatement(tree: AST.CommandStatement): string {
        let ret: string = tree.func.name + '(';
        ret += tree.args.map((a) => "'" + a.text + "'").join(',');
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
        let ret: string = this.pad() + '{\n';
        this.indent += 3;
        for (let statement of tree.statements)
            ret += this.pad() + this.writeStatement(statement);
        this.indent -= 3;
        ret += this.pad() + '}\n';
        return ret;
    }
}

export function JSWriter(tree: AST.Node): string {
    if (tree.kind === AST.SyntaxKind.Block) {
        let p = new JSWalker;
        let ret = '(function ($ws) {' +  p.writeBlock(tree as AST.Block) + '})(global);'
        return ret;
    }
    return 'unknown\n';
}
