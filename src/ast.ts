export interface TextRange {
    pos: number;
    end: number;
}

export enum SyntaxKind {
    Unknown = 0,
    Block = 1,
    InfixExpression = 2,
    Attribute = 3,
    PropertyBlock = 4,
    Property = 5,
    MethodBlock = 6,
    EventBlock = 7,
    EnumerationBlock = 8,
    Enumeration = 9,
    ExpressionStatement = 10,
    ClassDefinition = 11,
    FunctionDefinition = 13,
    SpecialFunctionCall = 14,
    MultiAssignmentStatement = 15,
    DeclarationStatement = 16,
    AssignmentStatement = 17,
    VariableDereference = 18,
    FieldExpression = 19,
    DynamicFieldExpression = 20,
    ArrayIndexExpression = 21,
    CellIndexExpression = 22,
    SwitchStatement = 23,
    CaseStatement = 24,
    OtherwiseStatement = 25,
    WhileStatement = 26,
    ThrowStatement = 27,
    TryStatement = 28,
    CatchStatement = 29,
    IfStatement = 30,
    ElseIfStatement = 31,
    ElseStatement = 32,
    ForStatement = 33,
    ForExpression = 34,
    PrefixExpression = 35,
    PostfixExpression = 36,
    MatrixDefinition = 37,
    CellDefinition = 38,
    IntegerLiteral = 39,
    StringLiteral = 40,
    FloatLiteral = 41,
    BreakStatement = 42,
    ContinueStatement = 43,
    Identifier = 44,
    EndOfTextToken = 45,
    PowerToken = 46,
    HermitianToken = 47,
    DotPowerToken = 48,
    TransposeToken = 49,
    NotToken = 50,
    LeftDivideToken = 51,
    RightDivideToken = 52,
    TimesToken = 53,
    DotLeftDivideToken = 54,
    DotRightDivideToken = 55,
    UnaryMinusToken = 56,
    UnaryPlusToken = 57,
    PlusToken = 58,
    MinusToken = 59,
    LessThanToken = 60,
    GreaterThanToken = 61,
    LessEqualsToken = 62,
    GreaterEqualsToken = 63,
    EqualsEqualsToken = 64,
    NotEqualsToken = 65,
    AndToken = 66,
    OrToken = 67,
    AndAndToken = 68,
    OrOrToken = 69,
    LeftWingToken = 70,
    RightWingToken = 71,
    LeftBracketToken = 72,
    RightBracketToken = 73,
    LeftParenthesisToken = 74,
    RightParenthesisToken = 75,
    ColonToken = 76,
    EqualsToken = 77,
    DotTimesToken = 78,
    GlobalToken = 79,
    PersistentToken = 80,
    DotToken = 81,
    ReturnStatement = 82,
    Blob = 83,
    Method = 84,
    Argument = 85,
    Comment = 86,
    Whitespace = 87,
    BreakToken = 88,
    CaseToken,
    CatchToken,
    ClassDefToken,
    ContinueToken,
    ElseToken,
    ElseIfToken,
    EndToken,
    ForToken,
    FunctionToken,
    IfToken,
    KeyboardToken,
    OtherwiseToken,
    ReturnToken,
    SwitchToken,
    ThrowToken,
    TryToken,
    WhileToken,
    SemiColonToken,
    CommaToken,
    NewlineToken
}

export interface Node extends TextRange {
    kind: SyntaxKind;
    parent?: Node;
}

// A token is a leaf of the parsing tree - but we still want to
// keep the position information for debug reasons
export interface Token<TKind extends SyntaxKind> extends Node {
    kind: TKind;
}

export type EndOfTextToken = Token<SyntaxKind.EndOfTextToken>;
export type PowerToken = Token<SyntaxKind.PowerToken>;
export type HermitianToken = Token<SyntaxKind.HermitianToken>;
export type DotPowerToken = Token<SyntaxKind.DotPowerToken>;
export type TransposeToken = Token<SyntaxKind.TransposeToken>;
export type NotToken = Token<SyntaxKind.NotToken>;
export type LeftDivideToken = Token<SyntaxKind.LeftDivideToken>;
export type RightDivideToken = Token<SyntaxKind.RightDivideToken>;
export type TimesToken = Token<SyntaxKind.TimesToken>;
export type DotLeftDivideToken = Token<SyntaxKind.DotLeftDivideToken>;
export type DotRightDivideToken = Token<SyntaxKind.DotRightDivideToken>;
export type UnaryMinusToken = Token<SyntaxKind.UnaryMinusToken>;
export type UnaryPlusToken = Token<SyntaxKind.UnaryPlusToken>;
export type PlusToken = Token<SyntaxKind.PlusToken>;
export type MinusToken = Token<SyntaxKind.MinusToken>;
export type LessThanToken = Token<SyntaxKind.LessThanToken>;
export type GreaterThanToken = Token<SyntaxKind.GreaterThanToken>;
export type LessEqualsToken = Token<SyntaxKind.LessEqualsToken>;
export type GreaterEqualsToken = Token<SyntaxKind.GreaterEqualsToken>;
export type EqualsEqualsToken = Token<SyntaxKind.EqualsEqualsToken>;
export type NotEqualsToken = Token<SyntaxKind.NotEqualsToken>;
export type AndToken = Token<SyntaxKind.AndToken>;
export type OrToken = Token<SyntaxKind.OrToken>;
export type AndAndToken = Token<SyntaxKind.AndAndToken>;
export type OrOrToken = Token<SyntaxKind.OrOrToken>;
export type LeftWingToken = Token<SyntaxKind.LeftWingToken>;
export type RightWingToken = Token<SyntaxKind.RightWingToken>;
export type LeftBracketToken = Token<SyntaxKind.LeftBracketToken>;
export type RightBracketToken = Token<SyntaxKind.RightBracketToken>;
export type LeftParenthesisToken = Token<SyntaxKind.LeftParenthesisToken>;
export type RightParenthesisToken = Token<SyntaxKind.RightParenthesisToken>;
export type ColonToken = Token<SyntaxKind.ColonToken>;
export type EqualsToken = Token<SyntaxKind.EqualsToken>;
export type DotTimesToken = Token<SyntaxKind.DotTimesToken>;
export type BreakToken = Token<SyntaxKind.BreakToken>;
export type CaseToken = Token<SyntaxKind.CaseToken>;
export type CatchToken = Token<SyntaxKind.CatchToken>;
export type ClassDefToken = Token<SyntaxKind.ClassDefToken>;
export type ContinueToken = Token<SyntaxKind.ContinueToken>;
export type ElseToken = Token<SyntaxKind.ElseToken>;
export type ElseIfToken = Token<SyntaxKind.ElseIfToken>;
export type EndToken = Token<SyntaxKind.EndToken>;
export type ForToken = Token<SyntaxKind.ForToken>;
export type FunctionToken = Token<SyntaxKind.FunctionToken>;
export type IfToken = Token<SyntaxKind.IfToken>;
export type KeyboardToken = Token<SyntaxKind.KeyboardToken>;
export type OtherwiseToken = Token<SyntaxKind.OtherwiseToken>;
export type ReturnToken = Token<SyntaxKind.ReturnToken>;
export type SwitchToken = Token<SyntaxKind.SwitchToken>;
export type ThrowToken = Token<SyntaxKind.ThrowToken>;
export type TryToken = Token<SyntaxKind.TryToken>;
export type WhileToken = Token<SyntaxKind.WhileToken>;

export type ScalarOperator = PlusToken | MinusToken | DotTimesToken | DotLeftDivideToken | DotRightDivideToken | DotPowerToken;
export type MatrixOperator = TimesToken | LeftDivideToken | RightDivideToken | PowerToken;
export type LogicalOperator = AndAndToken | AndToken | OrOrToken | OrToken;
export type ComparisonOperator = LessThanToken | LessEqualsToken | GreaterEqualsToken | GreaterThanToken | EqualsEqualsToken | NotEqualsToken;
export type BinaryOperator = ScalarOperator | MatrixOperator | LogicalOperator | ComparisonOperator | ColonToken;
export type DeclarationTypeToken = SyntaxKind.GlobalToken | SyntaxKind.PersistentToken;

export type UnaryOperator = SyntaxKind.UnaryMinusToken | SyntaxKind.UnaryPlusToken | SyntaxKind.NotToken;

export type Singleton = SyntaxKind.ReturnStatement | SyntaxKind.BreakStatement | SyntaxKind.ContinueStatement;

export interface Statement extends Node {
    printit?: boolean
}

export interface Expression extends Node {
}

export interface DereferenceExpression extends Node {
    kind: SyntaxKind.ArrayIndexExpression | SyntaxKind.CellIndexExpression | SyntaxKind.FieldExpression | SyntaxKind.DynamicFieldExpression;
}

export interface Blob extends Node {
    kind: SyntaxKind.Blob;
    text: string;
}

export interface SpecialFunctionCall extends Node {
    kind: SyntaxKind.SpecialFunctionCall;
    args: Blob[];
}

export interface FieldExpression extends DereferenceExpression {
    kind: SyntaxKind.FieldExpression;
    identifier: Identifier;
}

export interface DotFieldExpression extends DereferenceExpression {
    kind: SyntaxKind.DynamicFieldExpression;
    expression: Expression;
}

export interface ArrayIndexExpression extends DereferenceExpression {
    kind: SyntaxKind.ArrayIndexExpression;
    expressions: Expression[];
}

export interface CellIndexExpression extends DereferenceExpression {
    kind: SyntaxKind.CellIndexExpression;
    expressions: Expression[];
}

export interface VariableDereference extends Expression {
    kind: SyntaxKind.VariableDereference;
    identifier: Identifier;
    deref: DereferenceExpression[];
}

export interface MultiAssignmentStatement extends Statement {
    kind: SyntaxKind.MultiAssignmentStatement;
    lhs: VariableDereference[];
    expression: Expression;
}

export interface AssignmentStatement extends Statement {
    kind: SyntaxKind.AssignmentStatement;
    lhs: VariableDereference;
    expression: Expression;
}

export interface MatrixDefinition extends Expression {
    kind: SyntaxKind.MatrixDefinition | SyntaxKind.CellDefinition;
    expressions: Expression[][];
}


export interface LiteralExpression extends Expression {
    kind: SyntaxKind.FloatLiteral | SyntaxKind.IntegerLiteral | SyntaxKind.StringLiteral;
    text: string;
}

export interface UnaryExpression extends Expression {
    kind: SyntaxKind.PrefixExpression;
    operator: UnaryOperator;
    operand: Expression;
}


export interface InfixExpression extends Expression {
    kind: SyntaxKind.InfixExpression;
    leftOperand: Expression;
    operator: BinaryOperator;
    rightOperand: Expression;
}

export interface Block extends Node {
    kind: SyntaxKind.Block;
    statements: Statement[];
}

interface ControlStatement extends Statement {
    expression: Expression;
    body: Block;
}

export interface DeclarationStatement extends Statement {
    kind: SyntaxKind.DeclarationStatement;
    scope: DeclarationTypeToken;

}

export interface CaseStatement extends ControlStatement {
    kind: SyntaxKind.CaseStatement;
}

export interface OtherwiseStatement extends Statement {
    kind: SyntaxKind.OtherwiseStatement;
    body: Block;
}

export interface SwitchStatement extends Statement {
    kind: SyntaxKind.SwitchStatement;
    expr: Expression;
    cases: CaseStatement[];
    otherwise?: OtherwiseStatement;
}

export interface ExpressionStatement extends Statement {
    kind: SyntaxKind.ExpressionStatement;
    expression: Expression;
}

export interface ThrowStatement extends Statement {
    kind: SyntaxKind.ThrowStatement;
    expression: Expression;
}

export interface CatchStatement extends Statement {
    kind: SyntaxKind.CatchStatement;
    identifier: Identifier;
    body: Block;
}

export interface TryStatement extends Statement {
    kind: SyntaxKind.TryStatement;
    body: Block;
    catc?: CatchStatement;
}

export interface Identifier extends Node {
    kind: SyntaxKind.Identifier;
    name: string;
}

export interface ForExpression extends Node {
    kind: SyntaxKind.ForExpression;
    identifier: Identifier;
    expression: Expression;
}

export interface ForStatement extends ControlStatement {
    kind: SyntaxKind.ForStatement;
    expression: ForExpression;
    body: Block;
}

export interface SingletonStatement extends Statement {
    kind: Singleton;
}

export interface ReturnStatement extends SingletonStatement {
    kind: SyntaxKind.ReturnStatement;
}

export interface BreakStatement extends SingletonStatement {
    kind: SyntaxKind.BreakStatement;
}

export interface ContinueStatement extends SingletonStatement {
    kind: SyntaxKind.ContinueStatement;
}

export interface WhileStatement extends ControlStatement {
    kind: SyntaxKind.WhileStatement;
}

export interface ElseIfStatement extends ControlStatement {
    kind: SyntaxKind.ElseIfStatement;
}

export interface ElseStatement extends Statement {
    kind: SyntaxKind.ElseStatement;
    body: Block;
}

export interface IfStatement extends ControlStatement {
    kind: SyntaxKind.IfStatement;
    elifs: ElseIfStatement[];
    els?: ElseStatement;
}

export interface PostfixExpression extends Node {
    kind: SyntaxKind.PostfixExpression;
    operator: TransposeToken | HermitianToken;
    operand: Expression;
}

interface InitializedExpression extends Node {
    identifier: Identifier;
    init?: Expression;
}

interface AttributeNode extends InitializedExpression {
    kind: SyntaxKind.Attribute;
}

export interface Whitespace extends Node {
    kind: SyntaxKind.Whitespace;
}

export interface ClassBlock extends Node {
}

export interface PropertyNode extends InitializedExpression {
    kind: SyntaxKind.Property;
}

export interface ArgumentNode extends Node {
    kind: SyntaxKind.Argument;
    name: Identifier;
    reference: boolean;
}

export interface FunctionDef extends Node {
    kind: SyntaxKind.FunctionDefinition;
    name: Identifier;
    returns?: Identifier[];
    args?: ArgumentNode[];
    body: Block;
}

export interface MethodNode extends FunctionDef {
}

export interface PropertyBlock extends ClassBlock {
    kind: SyntaxKind.PropertyBlock;
    attributes?: AttributeNode[];
    properties?: PropertyNode[];
}

export interface StringLiteral extends Node {
    kind: SyntaxKind.StringLiteral;
    text: string;
}

export interface NumericLiteral extends Node {
    kind: SyntaxKind.FloatLiteral;
    text: string;
}

export interface Comment extends Node {
    kind: SyntaxKind.Comment;
    text: string;
}

export interface MethodBlock extends ClassBlock {
    kind: SyntaxKind.MethodBlock;
    attributes?: AttributeNode[];
    methods?: MethodNode[];
}

export interface ClassDefinition extends Node {
    kind: SyntaxKind.ClassDefinition;
    attributes?: AttributeNode[];
    name: Identifier;
    sup?: Identifier[];
    blocks?: ClassBlock[];
}

