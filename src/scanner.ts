/* A scanner for FreeMatJS - written for JS.
 Inspired by Eli Bendersky's posting: 
 http://eli.thegreenplace.net/2013/07/16/hand-written-lexer-in-javascript-compared-to-the-regex-based-ones.  
 Originally, lexical analysis was it's own thing in FreeMat5.  But I ended up with something very ugly 
 because of whitespace handling and special cases.  The lexical analyser tried to hide the context 
 sensitivity from the parser, and it got ugly.  When I rewrote the parser in peg.js, I ended up eliminating
 the lexical pass as it's just part of the rules in the peg.js file. But peg.js doesn't play well with 
 TypeScript, and it's far from stable.  So I'm back to building a parser by hand, and a clean lexical 
 pass makes sense to me.  Eli's version gave me some ideas, and the TypeScript compiler code provided
 the rest. */

import * as AST from './ast';

function isnewline(c: string): boolean {
    return c === '\r' || c === '\n';
}

function isnotnewline(c: string): boolean {
    return !isnewline(c);
}

function isexpmark(c: string): boolean {
    return c === 'e' || c === 'E';
}

function issign(c: string): boolean {
    return c === '+' || c === '-';
}

function isimag(c: string): boolean {
    return ((c === 'i') || (c === 'I') || (c === 'j') || (c === 'J'));
}

function isalpha(c: string): boolean {
    return ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c === '_'));
}

function isalnum(c: string): boolean {
    return ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9'));
}

function isdigit(c: string): boolean {
    return (c >= '0' && c <= '9');
}

function isablank(c: string): boolean {
    return ((c === ' ') || (c === '\t') || (c === '\r'));
}

function isclosing(c: string): boolean {
    return ((c === ']') || (c === ')') || (c === '}'));
}

const reserved_table = new Map([
    ["break", AST.SyntaxKind.BreakToken],
    ["case", AST.SyntaxKind.CaseToken],
    ["catch", AST.SyntaxKind.CatchToken],
    ["classdef", AST.SyntaxKind.ClassDefToken],
    ["continue", AST.SyntaxKind.ContinueToken],
    ["else", AST.SyntaxKind.ElseToken],
    ["elseif", AST.SyntaxKind.ElseIfToken],
    ["end", AST.SyntaxKind.EndToken],
    ["for", AST.SyntaxKind.ForToken],
    ["function", AST.SyntaxKind.FunctionToken],
    ["global", AST.SyntaxKind.GlobalToken],
    ["if", AST.SyntaxKind.IfToken],
    ["keyboard", AST.SyntaxKind.KeyboardToken],
    ["otherwise", AST.SyntaxKind.OtherwiseToken],
    ["persistent", AST.SyntaxKind.PersistentToken],
    ["return", AST.SyntaxKind.ReturnToken],
    ["switch", AST.SyntaxKind.SwitchToken],
    ["try", AST.SyntaxKind.TryToken],
    ["while", AST.SyntaxKind.WhileToken],
]);

const wide_operators_table = new Map([
    ['./', AST.SyntaxKind.DotRightDivideToken],
    ['.*', AST.SyntaxKind.DotTimesToken],
    ['.\\', AST.SyntaxKind.DotLeftDivideToken],
    ['.^', AST.SyntaxKind.DotPowerToken],
    ['<=', AST.SyntaxKind.LessEqualsToken],
    ['>=', AST.SyntaxKind.GreaterEqualsToken],
    ['==', AST.SyntaxKind.EqualsEqualsToken],
    ['~=', AST.SyntaxKind.NotEqualsToken],
    ['&&', AST.SyntaxKind.AndAndToken],
    ['||', AST.SyntaxKind.OrOrToken],
    [".'", AST.SyntaxKind.TransposeToken],
]);

const narrow_operators_table = new Map([
    ['^', AST.SyntaxKind.PowerToken],
    [';', AST.SyntaxKind.SemiColonToken],
    [',', AST.SyntaxKind.CommaToken],
    ["'", AST.SyntaxKind.HermitianToken],
    ['~', AST.SyntaxKind.NotToken],
    ['\\', AST.SyntaxKind.LeftDivideToken],
    ['/', AST.SyntaxKind.RightDivideToken],
    ['*', AST.SyntaxKind.TimesToken],
    ['+', AST.SyntaxKind.PlusToken],
    ['-', AST.SyntaxKind.MinusToken],
    ['>', AST.SyntaxKind.GreaterThanToken],
    ['<', AST.SyntaxKind.LessThanToken],
    ['&', AST.SyntaxKind.AndToken],
    ['|', AST.SyntaxKind.OrToken],
    ['.', AST.SyntaxKind.DotToken],
    ['}', AST.SyntaxKind.RightWingToken],
    ['{', AST.SyntaxKind.LeftWingToken],
    [']', AST.SyntaxKind.RightBracketToken],
    ['[', AST.SyntaxKind.LeftBracketToken],
    ['=', AST.SyntaxKind.EqualsToken],
    [':', AST.SyntaxKind.ColonToken],
    [')', AST.SyntaxKind.RightParenthesisToken],
    ['(', AST.SyntaxKind.LeftParenthesisToken],
    ['\n', AST.SyntaxKind.NewlineToken],
]);

// Build a lexical
// Convention is that pos/end refer to the arguments of substring - that
// means pos indicates the position of the first character, and end points to the
// first character _after_ the end of the token.

export class Scanner {
    pos: number;
    buf: string;
    buflen: number;
    consume(pos: number, test: (x: string) => boolean): number {
        if (pos >= this.buflen) return pos;
        if (!test(this.buf.charAt(pos))) return pos;
        while ((pos < this.buflen) && test(this.buf.charAt(pos))) {
            pos = pos + 1;
        }
        return pos;
    }
    match(template: string): boolean {
        return (this.buf.substr(this.pos, template.length) === template);
    }
    previous(): string {
        return this.char(this.pos - 1);
    }
    char(pos: number): string {
        return this.buf.charAt(pos);
    }
    constructor(text: string) {
        this.pos = 0;
        this.buf = text;
        this.buflen = text.length;
    }
    nextToken(): AST.Node {
        if (this.pos >= this.buflen) {
            return {
                kind: AST.SyntaxKind.EndOfTextToken,
                pos: this.pos,
                end: this.pos
            };
        }
        let c = this.char(this.pos);
        if (c === '%')
            return this.processComment();
        if (this.match('...'))
            return this.processContinuation();
        if (isalpha(c))
            return this.processIdentifier();
        if (isdigit(c) || ((c === '.') && (isdigit(this.char(this.pos + 1)))))
            return this.processNumber();
        if (isablank(c))
            return this.processWhitespace();
        if ((c === '\'') && !((this.previous() === '\'') || isclosing(this.previous()) || isalnum(this.previous())))
            return this.processString();
        // Check for the operators - order matters
        for (let [opname, kind] of wide_operators_table) {
            if (this.match(opname)) return this.processWideOperator(kind);
        }
        for (let [opname, kind] of narrow_operators_table) {
            if (c === opname) return this.processNarrowOperator(kind);
        }
        throw new Error('Unrecognized text at ' + this.pos);
    }
    processNarrowOperator(kind: AST.SyntaxKind): AST.Token<AST.SyntaxKind> {
        let tok: AST.Token<AST.SyntaxKind> = {
            kind: kind,
            pos: this.pos,
            end: this.pos + 1
        };
        this.pos++;
        return tok;
    }
    processWideOperator(kind: AST.SyntaxKind): AST.Token<AST.SyntaxKind> {
        let tok: AST.Token<AST.SyntaxKind> = {
            kind: kind,
            pos: this.pos,
            end: this.pos + 2
        };
        this.pos += 2;
        return tok;
    }
    processNumber(): AST.NumericLiteral {
        //{integer}.{integer}E{sign}{integer}
        //   s1   s2   s3   s4  s5    s6
        // .{integer}E{sign}{integer}
        let endpos = this.consume(this.pos + 1, isdigit);
        if (this.char(endpos) === '.') endpos++;
        endpos = this.consume(endpos, isdigit);
        if (isexpmark(this.char(endpos))) {
            endpos++;
            if (issign(this.char(endpos))) endpos++;
            endpos = this.consume(this.pos + endpos, isdigit);
        }
        if (isimag(this.char(endpos))) endpos++;
        let tok: AST.NumericLiteral = {
            kind: AST.SyntaxKind.FloatLiteral,
            text: this.buf.substring(this.pos, endpos),
            pos: this.pos,
            end: endpos
        }
        this.pos = endpos;
        return tok;
    }
    processIdentifier(): AST.Node {
        let endpos = this.consume(this.pos + 1, isalnum);
        const id = this.buf.substring(this.pos, endpos);
        if (reserved_table.has(id)) {
            let tok: AST.Node = {
                kind: reserved_table.get(id) as AST.SyntaxKind,
                pos: this.pos,
                end: endpos
            }
            this.pos = endpos;
            return tok;
        }
        let tok: AST.Identifier = {
            kind: AST.SyntaxKind.Identifier,
            name: this.buf.substring(this.pos, endpos),
            pos: this.pos,
            end: endpos
        }
        this.pos = endpos;
        return tok;
    }
    processWhitespace(): AST.Whitespace {
        let endpos = this.consume(this.pos + 1, isablank);
        let tok: AST.Whitespace = {
            kind: AST.SyntaxKind.Whitespace,
            pos: this.pos,
            end: endpos
        }
        this.pos = endpos;
        return tok
    }
    processContinuation(): AST.Whitespace {
        let endpos = this.consume(this.pos + 3, isnotnewline);
        let tok: AST.Whitespace = {
            kind: AST.SyntaxKind.Whitespace,
            pos: this.pos,
            end: endpos
        }
        this.pos = endpos;
        return tok;
    }
    isBlockCommentStart(): boolean {
        if (this.buf.substring(this.pos, this.pos + 2) !== '%{') return false;
        // Could be the start of a block comment... but need to scan backwards
        let scan = this.pos - 1;
        while (true) {
            if (scan < 0) {
                return true;
            }
            if (isablank(this.buf.charAt(scan))) {
                scan--;
            } else if (this.buf.charAt(scan) === '\n') {
                return true;
            } else {
                return false;
            }
        }
    }
    processBlockComment(): AST.Comment {
        let scan = this.pos + 2;
        let startline = true;
        let endpos = scan;
        while (true) {
            if (scan >= this.buf.length) {
                endpos = -1;
                break;
            }
            if (startline && this.buf.substring(scan, scan + 2) === '%}') {
                endpos = scan + 2;
                break;
            }
            if (isablank(this.buf.charAt(scan))) scan++;
            else if (this.buf.charAt(scan) === '\n') {
                scan++;
                startline = true;
            } else {
                scan++;
                startline = false;
            }
        }
        if (endpos === -1)
            throw Error("Unterminated block comment");
        let tok: AST.Comment = {
            kind: AST.SyntaxKind.Comment,
            text: this.buf.substring(this.pos, endpos),
            pos: this.pos,
            end: endpos
        }
        this.pos = endpos;
        return tok;
    }
    processComment(): AST.Comment {
        // check for a block comment case
        if (this.isBlockCommentStart())
            return this.processBlockComment();
        let endpos = this.consume(this.pos + 1, isnotnewline);
        let tok: AST.Comment = {
            kind: AST.SyntaxKind.Comment,
            text: this.buf.substring(this.pos, endpos),
            pos: this.pos,
            end: endpos
        }
        this.pos = endpos;
        return tok;
    }
    processString(): AST.StringLiteral {
        let end_found = false;
        let end_index = this.pos + 1;
        while (!end_found) {
            if (end_index >= this.buf.length) {
                throw Error('Unterminated string at ' + this.pos);
            }
            if (this.buf.substring(end_index, end_index + 3) === "'''")
                end_index = end_index + 3;
            else if (this.buf[end_index] === "'")
                end_found = true;
            else
                end_index = end_index + 1;
        }
        let tok: AST.StringLiteral = {
            kind: AST.SyntaxKind.StringLiteral,
            text: this.buf.substring(this.pos, end_index + 1),
            pos: this.pos,
            end: end_index
        };
        this.pos = end_index + 1;
        return tok;
    }
};

export default function Tokenize(text: string): AST.Node[] {
    let scan = new Scanner(text);
    let more = true;
    let tokens: AST.Node[] = [];
    while (more) {
        let tok = scan.nextToken();
        tokens.push(tok);
        more = tok.kind != AST.SyntaxKind.EndOfTextToken;
    }
    return tokens;
}
