import * as AST from './ast';
///import {inspect} from 'util';

export enum SymbolFlags {
    Unknown = 0,
    Global = 1,
    Persistent = 2,
    Parameter = 3,
    Reference = 4,
    Return = 5,
    Local = 6,
    Free = 7,
    Captured = 8,
    Nested = 9,
    Property = 10,
    Method = 11,
    Constructor = 12,
    Getter = 13,
    Setter = 14,
    Constant = 15,
    Dependent = 16,
    Super = 17,
    Explicit = 18,
    Object = 19,
    Event = 20,
    Subsref = 21,
    Subsasgn = 22,
    Function = 23,
    Argument = 24
}

export enum FunctionFlags {
    Unknown = 0,
    Normal = 1,
    Nested = 2,
    Method = 3,
    Local = 4,
    Constructor = 5,
    Setter = 6,
    Getter = 7,
    Subsref = 8,
    Subsasgn = 9,
    Anonymous = 10
}

export type SymbolMap = Map<string,SymbolFlags[]>

export interface SymbolTable {
    symbols: SymbolMap,
    children: Map<string,SymbolTable>,
    parent: SymbolTable|undefined
}
  
class SymbolPass {
    map: SymbolTable;
    current: SymbolTable;
    constructor() {
        this.map = {
            symbols: new Map(),
            children: new Map(),
            parent: undefined
        }
        this.current = this.map;
    }
    nameIsUnknown(name: string): boolean {
        return !this.current.symbols.has(name);
    }
    lookup(name:string): SymbolFlags[] {
        if (this.current.symbols.has(name))
            return this.current.symbols.get(name)!;
        return [];
    }
    describe(flags: SymbolFlags[]): string {
        let ret : string = '';
        for (let flag of flags)
            ret += SymbolFlags[flag] + ',';
        return ret;
    }
    addExclusive(name:string, flag:SymbolFlags) : void {
        let flagset = this.lookup(name);
        if (flagset.length)
            throw new SyntaxError('Cannot declare '+name+' as ' + SymbolFlags[flag] + ' as it is already scoped as '+this.describe(flagset));
        else
            flagset.push(flag);
        this.current.symbols.set(name,flagset);
    }
    addParameter(name:string) : void {
        let flagset = this.lookup(name);
        if (flagset.every(x => x === SymbolFlags.Return))
            flagset.push(SymbolFlags.Argument);
        else
            throw new SyntaxError('Function argument '+name+' cannot also be '+this.describe(flagset));
        this.current.symbols.set(name,flagset);
    }
    addReturn(name:string) : void {
        let flagset = this.lookup(name);
        if (flagset.every(x => x === SymbolFlags.Argument))
            flagset.push(SymbolFlags.Return);
        else
            throw new SyntaxError('Function return '+name+' cannot also be '+this.describe(flagset));
       this.current.symbols.set(name,flagset);
    }
    addWrite(name:string): void {
        let flagset = this.lookup(name);
        if (flagset.length === 0)
            flagset.push(SymbolFlags.Local);
        this.current.symbols.set(name,flagset);
    }
    parentScopeDefines(name:string): boolean {
        let k = this.current.parent;
        while (k) {
            if (k.symbols.has(name)) {
                let flagset = k.symbols.get(name)!;
                if (flagset.indexOf(SymbolFlags.Captured) === -1) {
                    flagset.push(SymbolFlags.Captured);
                    k.symbols.set(name,flagset);
                }
                return true;
            }
            k = k.parent;
        }
        return false;
    }
    addRead(name:string): void {
        let flagset = this.lookup(name);
        if (flagset.length === 0) {
            // See if it's declared in a parent scope
            if (this.parentScopeDefines(name))
                flagset.push(SymbolFlags.Free)
            else
                flagset.push(SymbolFlags.Unknown);
        }
        this.current.symbols.set(name,flagset);
    }
    addScope(name:string): void {
        const newmap : SymbolTable = {
            symbols: new Map(),
            children: new Map(),
            parent: this.current      
        }
        this.current.children.set(name,newmap);
        this.current = newmap;
    }
    popScope():void {
        if (this.current.parent)
           this.current = this.current.parent;
        else
            throw new RangeError('Underflow of scope stack - this is an internal error - please report!');
    }
    processToken(tree: AST.Node): void {
        switch (tree.kind) {
            case AST.SyntaxKind.Block: {
                let funclist: AST.Node[] = [];
                for (let p of (tree as AST.Block).statements) {
                    if (p.kind === AST.SyntaxKind.FunctionDefinition)
                        funclist.push(p);
                    else
                        this.processToken(p);
                }
                for (let p of funclist) {
                    this.processToken(p);
                }
                break;
            }
            case AST.SyntaxKind.DeclarationStatement: {
                const ttree = tree as AST.DeclarationStatement;
                const isGlobal : boolean = (ttree.scope === AST.SyntaxKind.GlobalToken);
                for (let v of ttree.vars)
                    if (isGlobal)
                        this.addExclusive(v.name,SymbolFlags.Global);
                    else
                        this.addExclusive(v.name,SymbolFlags.Persistent);
                break;
            }
            case AST.SyntaxKind.VariableDereference: {
                const ttree = tree as AST.VariableDereference;
                this.addRead(ttree.identifier.name); //TODO - functions mean no {} or .
                for (let t of ttree.deref)
                    this.processToken(t);
                break;
            }
            case AST.SyntaxKind.AssignmentStatement: {
                const ttree = tree as AST.AssignmentStatement;
                this.addWrite(ttree.lhs.identifier.name);
                this.processToken(ttree.expression);
                break;
            }
            case AST.SyntaxKind.ExpressionStatement: {
                const ttree = tree as AST.ExpressionStatement;
                this.processToken(ttree.expression);
                break;
            }
            case AST.SyntaxKind.PostfixExpression: {
                const ttree = tree as AST.PostfixExpression;
                this.processToken(ttree.operand);
                break;
            }
            case AST.SyntaxKind.PrefixExpression: {
                const ttree = tree as AST.UnaryExpression;
                this.processToken(ttree.operand);
                break;
            }
            case AST.SyntaxKind.MatrixDefinition: {
                const ttree = tree as AST.MatrixDefinition;
                for (let x of ttree.expressions)
                    for (let y of x)
                        this.processToken(y);
                break;
            }
            case AST.SyntaxKind.CellDefinition: {
                const ttree = tree as AST.MatrixDefinition;
                for (let x of ttree.expressions)
                    for (let y of x)
                        this.processToken(y);
                break;
            }
            case AST.SyntaxKind.InfixExpression: {
                const ttree = tree as AST.InfixExpression;
                this.processToken(ttree.leftOperand);
                this.processToken(ttree.rightOperand);
                break;
            }
            case AST.SyntaxKind.FunctionDefinition: {
                const ttree = tree as AST.FunctionDef;
                this.addScope(ttree.name.name);
                this.addExclusive(ttree.name.name,SymbolFlags.Function);
                for (let n of ttree.args) 
                    this.addParameter(n.name);
                for (let n of ttree.returns)
                    this.addReturn(n.name);
                this.processToken(ttree.body);
                this.popScope();
                break;
            }
            default:
                console.log("Unhandled token", tree.kind)
        }
    }
}

export function Symbols(tree: AST.Node): SymbolTable {
    let p = new SymbolPass;
    p.processToken(tree);
    return p.map;
}