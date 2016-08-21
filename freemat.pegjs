{
  "use strict"

  // Much of this came from here:
  // http://mazko.github.io/jsjavaparser/
  // TODO - handle continuation

  function extractOptional(optional, index, def) {
    def = typeof def !== 'undefined' ?  def : null;
    return optional ? optional[index] : def;
  }

  function extractList(list, index) {
    var result = new Array(list.length), i;

    for (i = 0; i < list.length; i++) {
      result[i] = list[i][index];
    }

    return result;
  }

  function buildList(first, rest, index) {
    return [first].concat(extractList(rest, index));
  }

  function buildTree(first, rest, builder) {
    var result = first, i;

    for (i = 0; i < rest.length; i++) {
      result = builder(result, rest[i]);
    }

    return result;
  }

  function buildInfixExpr(first, rest, opindex = 0) {
    return buildTree(first, rest, function(result, element) {
      return {
        node:        'InfixExpression',
        operator:     element[0][opindex], // remove ending Spacing
        leftOperand:  result,
        rightOperand: element[1]
      };
    });
  }

  function buildQualified(first, rest, index) {
    return buildTree(first, rest, 
      function(result, element) {
        return {
          node:     'QualifiedName',
          qualifier: result,
          name:      element[index]
        };
      }
    );
  }

  function popQualified(tree) {
    return tree.node === 'QualifiedName' 
      ? { name: tree.name, expression: tree.qualifier }
      : { name: tree, expression: null };
  }

  function extractThrowsClassType(list) {
    return list.map(function(node){ 
      return node.name; 
    });
  }

  function extractExpressions(list) {
    return list.map(function(node) { 
      return node.expression; 
    });
  }

  function buildArrayTree(first, rest) {
    return buildTree(first, rest, 
      function(result, element) {
      return {
        node:         'ArrayType',
        componentType: result
      }; 
    });
  }

  function optionalList(value) {
    return value !== null ? value : [];
  }

  function extractOptionalList(list, index) {
    return optionalList(extractOptional(list, index));
  }

  function skipNulls(list) {
    return list.filter(function(v){ return v !== null; });
  }

  function makePrimitive(code) {
    return {
      node:             'PrimitiveType',
      primitiveTypeCode: code
    }
  }

  function makeModifier(keyword) {
    return { 
      node:   'Modifier', 
      keyword: keyword 
    };
  }

  function makeCatchFinally(catchClauses, finallyBlock) {
      return { 
        catchClauses: catchClauses, 
        finally:      finallyBlock 
      };
  }

  function buildTypeName(qual, args, rest) {
    var first = args === null ? {
      node: 'SimpleType',
      name:  qual
    } : {
      node: 'ParameterizedType',
      type:  {
          node: 'SimpleType',
          name:  qual
      },
      typeArguments: args
    };

    return buildTree(first, rest, 
      function(result, element) {
        var args = element[2];
        return args === null ? {
          node:     'QualifiedType',
          name:      element[1],
          qualifier: result
        } :
        {
          node: 'ParameterizedType',
          type:  {
            node:     'QualifiedType',
            name:      element[1],
            qualifier: result
          },
          typeArguments: args
        };
      }
    );
  }

  function mergeProps(obj, props) {
    var key;
    for (key in props) {
      if (props.hasOwnProperty(key)) {
        if (obj.hasOwnProperty(key)) {
          throw new Error(
            'Property ' + key + ' exists ' + line() + '\n' + text() + 
            '\nCurrent value: ' + JSON.stringify(obj[key], null, 2) + 
            '\nNew value: ' + JSON.stringify(props[key], null, 2)
          );
        } else {
          obj[key] = props[key];
        }
      }
    }
    return obj;
  }

  function buildSelectorTree(arg, sel, sels) {
    function getMergeVal(o,v) {
      switch(o.node){
        case 'SuperFieldAccess':
        case 'SuperMethodInvocation':
          return { qualifier: v };
        case 'ArrayAccess':
          return { array: v };
        default:
          return { expression: v };
      }
    }
    return buildTree(mergeProps(sel, getMergeVal(sel, arg)), 
      sels, function(result, element) {
        return mergeProps(element, getMergeVal(element, result));
    });
  }

  function TODO() {
    throw new Error('TODO: not impl line ' + line() + '\n' + text());
  }
}

Block = statements:BlockStatements {
      return {
      	     node: 'Block',
	     statements: statements
	     }
}

BlockStatements = Statement*

Statement = ForStatement / BreakStatement / ContinueStatement /
          WhileStatement / IfStatement / SwitchStatement / TryStatement /
          ThrowStatement / ReturnStatement / DeclarationStatement /
          AssignmentStatement / MultiAssignment / FunctionDef /
          SpecialFunctionCall / ExpressionStatement

ExpressionStatement = expr:Expression term:StatementSep
{return {node:'ExpressionStatement', expr: expr, term: term} }

FunctionDef = FUNCTION returns:(FunctionReturnSpec)? name:Identifier args:(FunctionArgs)? SEP body:Block END?
{return {node:'FunctionDef', returns:returns, identifier:name, args:args, body:body} }

FunctionArgs = LPAR first:Identifier rest:(COMMA AMPERSAND? Identifier)* RPAR

FunctionReturnSpec = id:Identifier EQ / LBRACKET Identifier (COMMA Identifier)* RBRACKET EQ

SpecialFunctionCall = id:Identifier Spacing first:Blob rest:(Spacing Blob)* StatementSep
{return {node:'SpecialFunctionCall', func: id, args: buildList(first, rest, 1)}}

MultiAssignment = LBRACKET  first:VariableDereference rest:(COMMA? VariableDereference)* RBRACKET EQ expr:Expression StatementSep
{return {node:'MultiAssignmentStatement', lhs: buildList(first, rest, 1), expr: expr}}

//TODO add initialization 
DeclarationStatement = type:(GLOBAL / PERSISTENT) id:Identifier+ StatementSep
{return {node:'DeclarationStatement', type: type[0], identifiers: id}}

AssignmentStatement = lhs:VariableDereference EQ expr:Expression (SEP/SEMI)+
{return {node:'AssignmentStatement', lhs: lhs, expr: expr}}

VariableDereference = id:Identifier deref:(DereferenceExpression)*
{return {node:'VariableDereference', identifier: id, deref: deref}}

DereferenceExpression = FieldExpression / DynamicFieldExpression / ArrayIndexExpression / CellIndexExpression;

FieldExpression = DOT id:Identifier
{return {node:'FieldExpression', identifier: id}}

DynamicFieldExpression = DOT LPAR expr:Expression RPAR
{return {node:'DynamicFieldExpression', expression: expr}}

ArrayIndexExpression = LPAR expr:(Expression)? RPAR
{return {node:'ArrayIndexExpression', expression: expr}}

CellIndexExpression = LWING expr:Expression RWING
{return {node: 'CellIndexExpression', expression: expr}}

BreakStatement = BREAK SEMI?

ContinueStatement = CONTINUE SEMI?

// Can otherwise appear anywhere?  Can you have multiple otherwise clauses?
SwitchStatement = SWITCH expr:Expression StatementSep cases:(CaseStatement)* otherwise:(OtherwiseStatement)? END StatementSep {
  return {node: 'SwitchStatement', cases: cases, expression: expr, otherwise: otherwise}
}

CaseStatement = CASE expr:Expression StatementSep body:Block
    {return {node: 'CaseStatement', expression: expr, body: body}}

OtherwiseStatement = OTHERWISE StatementSep body:Block
    {return {node: 'OtherwiseStatement', body: body}}

WhileStatement = WHILE expr:Expression StatementSep body:Block END StatementSep {
  return {node: 'WhileStatement', expression: expr, body: body}
}

ReturnStatement = RETURN SEMI?

ThrowStatement = THROW expr:Expression
{ return {node: 'ThrowStatement', expression: expr} }

TryStatement = TRY StatementSep body:Block cat:Catch? END StatementSep
  {return {node: 'TryStatement', body: body, cat: cat}};

Catch = CATCH id:Identifier? StatementSep body:Block
  {return {node: 'CatchStatement', body: body, identifier: id}};

IfStatement = IF expr:Expression StatementSep body:Block elif:(ElseIfStatement)* els:ElseStatement? END StatementSep {
  return {node: 'IfStatement', expression: expr, body: body, elifs: elif, els: els}
}

ElseIfStatement = ELSEIF expr:Expression StatementSep body:Block {
  return {node: 'ElseIfStatement', expression: expr, body: body}
}

ElseStatement = ELSE StatementSep body:Block {
  return {node: 'ElseStatement', body: body}
}

ForStatement = FOR expr:ForExpression StatementSep body:Block END StatementSep {
             return {
             node: 'ForStatement',
             expression: expr,
             body: body }
}

ForExpression = id:Identifier EQ expr:Expression {
   return {
     node: 'ForExpression',
     identifier: id,
     exprression: expr
     }
    } / LPAR expr:ForExpression RPAR {return expr}

Expression = expr:ShortcutOrExpression {return expr}

ShortcutOrExpression
 = first:ShortcutAndExpression rest:(OROR ShortcutAndExpression)* {return buildInfixExpr(first, rest, 1);}

ShortcutAndExpression
 = first:OrExpression rest:(ANDAND OrExpression)* {return buildInfixExpr(first, rest, 1);}

OrExpression
 = first:AndExpression rest:(OR AndExpression)* {return buildInfixExpr(first, rest, 1);}

AndExpression
 = first:ComparisonExpression rest:(AND ComparisonExpression)* {return buildInfixExpr(first, rest, 1);}

ComparisonExpression
 = first:ColonExpression rest:((LT / GT / LE / GE / EQU / NE) ColonExpression)* {return buildInfixExpr(first, rest, 1);}

ColonExpression
 = first:AdditiveExpression rest:(COLON AdditiveExpression)* {return buildInfixExpr(first, rest,1);}

AdditiveExpression
 = first:MultiplicativeExpression rest:((PLUS/MINUS) MultiplicativeExpression)* {return buildInfixExpr(first,rest,1);}

MultiplicativeExpression
 = first:UnaryExpression rest:((DOTTIMES / DOTRDIV / DOTLDIV / TIMES / RDIV / LDIV) UnaryExpression)*
 {return buildInfixExpr(first,rest,1);}

UnaryExpression
 = operator:(PLUS/MINUS/NOT) operand:UnaryExpression {return {node: 'PrefixExpression', operator: operator[1], operand: operand};} /
   PostfixExpression

PostfixExpression
 = arg:PowerExpression operator:(TRANSPOSE / HERMITIAN)+ { /* Multiple postfixes? */
    return {node: 'PostfixExpression', operator: operator[0][0], operand: arg} } / PowerExpression;

PowerExpression
 = first:Primary rest:((POWER/DOTPOWER) Primary)* {return buildInfixExpr(first, rest, 1);}

Primary
 = ParExpression / Literal / VariableDereference / MatrixDefinition / CellDefinition

ParExpression
 = LPAR expr:Expression RPAR {return expr;}

MatrixDefinition
 = LBRACKET expr:ExpressionMatrix RBRACKET
 {return {node: 'MatrixDefinition', expression: expr} }

CellDefinition
 = LWING expr:ExpressionMatrix RWING
 {return {node: 'CellDefinition', expression: expr} }

ExpressionMatrix
 = first:ExpressionRow rest:((SEP/SEMI) ExpressionRow)*
 {return buildList(first, rest, 1);}

ExpressionRow
 = first:MatExpression rest:((COMMA/Spacing) MatExpression)*
 {return buildList(first, rest, 1);}

// This is very un-DRY, but I don't know how to inject the
// context information (that we are inside a bracket
// expression/matrix definition) otherwise

MatExpression = expr:MatShortcutOrExpression {return expr}

MatShortcutOrExpression
 = first:MatShortcutAndExpression rest:(OROR MatShortcutAndExpression)* {return buildInfixExpr(first, rest, 1);}

MatShortcutAndExpression
 = first:MatOrExpression rest:(ANDAND MatOrExpression)* {return buildInfixExpr(first, rest, 1);}

MatOrExpression
 = first:MatAndExpression rest:(OR MatAndExpression)* {return buildInfixExpr(first, rest, 1);}

MatAndExpression
 = first:MatComparisonExpression rest:(AND MatComparisonExpression)* {return buildInfixExpr(first, rest, 1);}

MatComparisonExpression
 = first:MatColonExpression rest:((LT / GT / LE / GE / EQU / NE) MatColonExpression)* {return buildInfixExpr(first, rest, 1);}

MatColonExpression
 = first:MatAdditiveExpression rest:(COLON MatAdditiveExpression)* {return buildInfixExpr(first, rest,1);}

MatAdditiveExpression
 = first:MatMultiplicativeExpression rest:((JPLUS/JMINUS/OPLUS/OMINUS) MatMultiplicativeExpression)* {return buildInfixExpr(first,rest,0);}

MatMultiplicativeExpression
 = first:MatUnaryExpression rest:((DOTTIMES / DOTRDIV / DOTLDIV / TIMES / RDIV / LDIV) MatUnaryExpression)*
 {return buildInfixExpr(first,rest,1);}

MatUnaryExpression
 = operator:(UPLUS/UMINUS/NOT) operand:MatUnaryExpression {return {node: 'PrefixExpression', operator: operator[1], operand: operand};} /
   PostfixExpression

Literal
 = literal:(FloatLiteral / IntegerLiteral / StringLiteral) {return literal;}

// TODO - M does not allow for precision suffixes
FloatLiteral
    = Digits "." Digits?  Exponent? [fFdD]?
    / "." Digits Exponent? [fFdD]?
    / Digits Exponent [fFdD]?
    / Digits Exponent? [fFdD]

Exponent
    = [eE] [+\-]? Digits

Blob
    = !IsolatedOperator first:NotSpace rest:$NotSpace*
    {return first + rest; }

IsolatedOperator
    = ( "||" / "&&" / "|" / "&" / "<=" / ">=" / "<" / ">" / "~=" / "+" / "-" / ".*" / "./" / ".\\" / "*" / "/" / "\\" / ".^" / "'" / ".'" / "^" / "==" ) [ ]+

NotSpace
    = [^ \t\n;]

Identifier
    = !Keyword first:Letter rest:$LetterOrDigit* Spacing
    {return first + rest; }

Letter = [a-z] / [A-Z] / [_];

LetterOrDigit = [a-z] / [A-Z] / [0-9] / [_];

Keyword
 = ("break" /
   "case" /
   "catch" /
   "classdef" /
   "continue" /
   "else" /
   "elseif" /
   "end" /
   "events" /
   "for" /
   "function" /
   "global" /
   "if" /
   "keyboard" /
   "methods" /
   "otherwise" /
   "persistent" /
   "properties" /
   "quit" /
   "retall" /
   "return" /
   "switch" /
   "throw" /
   "try" /
   "while")

// Do we support various integer types?
IntegerLiteral
    = Digits {return {node: 'IntegerLiteral', token: text() };}

StringLiteral
    = "'" (!['] _)* "'"
    { return {node: 'StringLiteral', escapedValue: text() }; }

Digits
    = [0-9]([_]*[0-9])*

SEMI
    = ";" Spacing

GLOBAL
    = ("GLOBAL"/"global") Spacing

PERSISTENT
    = ("PERSISTENT"/"persistent") Spacing

FUNCTION
    = "function" Spacing

SEP
    = [ \t]*[\r\n]+ Spacing

END
    = ("END"/"end") Spacing

BREAK
    = ("BREAK"/"break") Spacing

CONTINUE
    = ("CONTINUE"/"continue") Spacing

SWITCH
    = ("SWITCH"/"switch") Spacing

CASE
    = ("CASE"/"case") Spacing

OTHERWISE
    = ("OTHERWISE"/"otherwise") Spacing

WHILE
    = ("WHILE"/"while") Spacing

RETURN
    = ("RETURN"/"return") Spacing

THROW
    = ("THROW"/"throw") Spacing

TRY
    = ("TRY"/"try") Spacing

CATCH
    = ("CATCH"/"catch") Spacing

FOR
    = ("FOR"/"for") !LetterOrDigit Spacing

IF
    = ("IF"/"if") Spacing

ELSE
    = ("ELSE"/"else") Spacing

ELSEIF
    = ("ELSEIF"/"elseif") Spacing

LPAR
    = "(" Spacing

RPAR
    = ")" Spacing

COMMA
    = "," Spacing

COLON
    = Spacing ":" Spacing

AMPERSAND
    = "&" Spacing

EQ
   = Spacing "=" !"=" Spacing

EQU
    = Spacing "==" Spacing

LBRACKET
    = "[" Spacing

RBRACKET
    = "]" Spacing

LWING
    = "{" Spacing

RWING
    = "}" Spacing

DOT
    = "."

OROR
    = Spacing "||" Spacing

ANDAND
    = Spacing "&&" Spacing

OR
    = Spacing "|" !"|" Spacing

AND
    = Spacing "&" !"&" Spacing

LT
    = Spacing "<"![<=] Spacing

LE
    = Spacing "<=" Spacing

GT
    = Spacing ">"![=>] Spacing

GE
    = Spacing ">=" Spacing

NE
    = Spacing "~=" Spacing

PLUS
    = Spacing "+" Spacing

MINUS
    = Spacing "-" Spacing

OPLUS
    = [ ]+ rest:("+" [ ]+) {return rest;}

OMINUS
    = [ ]+ rest:("-" [ ]+) {return rest;}

JPLUS
    = "+" Spacing

JMINUS
    = "-" Spacing

UPLUS
    = Spacing "+"

UMINUS
    = Spacing "-"

DOTTIMES
    = Spacing ".*" Spacing

DOTRDIV
    = Spacing "./" Spacing

DOTLDIV
    = Spacing ".\\" Spacing

TIMES
    = Spacing "*" Spacing

RDIV
    = Spacing "/" Spacing

LDIV
    = Spacing "\\" Spacing

NOT
    = Spacing "~" !"=" Spacing

TRANSPOSE
    = "'" Spacing

DOTPOWER
    = Spacing ".^" Spacing

HERMITIAN
    = ".'" Spacing

POWER
    = Spacing "^" Spacing

StatementSep
    = (SEMI/[\n]/COMMA) Spacing

Spacing
    = [ \t]*

EOT = !_

_   = .

