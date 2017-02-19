declare namespace fmp {
    interface TextRange {
        pos: number;
        end: number;
    }

    enum SyntaxKind {
        Unknown = 0,
        Block = 1,
        InfixExpression = 2,
        Attribute = 3,
        PropertyBlock = 4,
        Property = 5,
        MethodBlock = 6,
        EventBLock = 7,
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
        FloatLiteral = 41
    }

    interface ASTNode {
        readonly node: string;
    }

    interface InfixExpression extends ASTNode {
        readonly operator: string;
        readonly leftOperand: ASTNode;
        readonly rightOperand: ASTNode;
    }


    interface BlockExpression extends ASTNode {
        readonly statements: ASTNode[];
    }

    interface AttributeNode extends ASTNode {
        readonly identifier: string;
        readonly init?: string;
    }

    interface ClassDefinition extends ASTNode {
        readonly attributes?: AttributeNode[];

    }
}
