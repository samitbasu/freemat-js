import Tokenize from '../scanner';
import { Parser } from '../parser';
import { Symbols, SymbolTable, SymbolFlags } from '../symbol';
import { suite, test } from "mocha-typescript";
const assert = require('chai').assert;
import { inspect } from 'util';

function mkSyms(cmd: string): SymbolTable {
    const tok = Tokenize(cmd);
    const pars = new Parser(tok, cmd);
    const b = pars.block();
    console.log(inspect(b, { depth: 100 }))
    const s = Symbols(b);
    console.log(inspect(s, { depth: 8 }));
    return s;
}

function lookupScope(p: SymbolTable, path: string): SymbolTable {
    let k: SymbolTable | undefined = p;
    for (let scope of path.split(':')) {
        k = k!.children.get(scope);
        assert.isDefined(k);
    }
    return k!;
}

function assertDefinition(p: SymbolTable, scope: string, name: string, flag: SymbolFlags[]) {
    const k = lookupScope(p, scope);
    assert.isDefined(k);
    const k1 = (k as SymbolTable).symbols;
    assert.isDefined(k1.get(name));
    const k2 = k1.get(name) as SymbolFlags[];
    console.log(flag);
    assert.equal(k2.length, flag.length);
    assert(k2.every(x => flag.indexOf(x) !== -1));
}

@suite("Symbol analysis pass")
export class SymbolAnalysis {
    @test "should properly analyze arguments, returns"() {
        const p = mkSyms('function [a,b,c] = foo(d,e,f); end');
        assertDefinition(p, 'foo', 'foo', [SymbolFlags.Function]);
        assertDefinition(p, 'foo', 'd', [SymbolFlags.Argument]);
        assertDefinition(p, 'foo', 'e', [SymbolFlags.Argument]);
        assertDefinition(p, 'foo', 'f', [SymbolFlags.Argument]);
        assertDefinition(p, 'foo', 'a', [SymbolFlags.Return]);
        assertDefinition(p, 'foo', 'b', [SymbolFlags.Return]);
        assertDefinition(p, 'foo', 'c', [SymbolFlags.Return]);
    }
    @test "should handle returns that match arguments"() {
        const p = mkSyms('function x = foo(x); end');
        assertDefinition(p, 'foo', 'x', [SymbolFlags.Argument, SymbolFlags.Return]);
    }
    @test "should handle globals correctly"() {
        const p = mkSyms('function foo; global x; end');
        assertDefinition(p, 'foo', 'foo', [SymbolFlags.Function]);
        assertDefinition(p, 'foo', 'x', [SymbolFlags.Global]);
    }
    @test "should handle persistent correctly"() {
        const p = mkSyms('function foo; persistent x; end');
        assertDefinition(p, 'foo', 'foo', [SymbolFlags.Function]);
        assertDefinition(p, 'foo', 'x', [SymbolFlags.Persistent]);
    }
    @test "should handle local correctly"() {
        const p = mkSyms('function foo; x = 32; end');
        assertDefinition(p, 'foo', 'foo', [SymbolFlags.Function]);
        assertDefinition(p, 'foo', 'x', [SymbolFlags.Local]);
    }
    @test "should prioritize argument over local"() {
        const p = mkSyms('function foo(x); x = 32; end');
        assertDefinition(p, 'foo', 'foo', [SymbolFlags.Function]);
        assertDefinition(p, 'foo', 'x', [SymbolFlags.Argument]);
    }
    @test "should prioritize returns over local"() {
        const p = mkSyms('function x = foo(y); x = 32; end');
        assertDefinition(p, 'foo', 'foo', [SymbolFlags.Function]);
        assertDefinition(p, 'foo', 'x', [SymbolFlags.Return]);
    }
    @test "should prioritize returns/argument over local"() {
        const p = mkSyms('function x = foo(x); x = 32; end');
        assertDefinition(p, 'foo', 'foo', [SymbolFlags.Function]);
        assertDefinition(p, 'foo', 'x', [SymbolFlags.Return, SymbolFlags.Argument]);
    }
    @test "should not allow a global name to be an argument"() {
        const t = 'function x = foo(x); global x; end';
        assert.throws(() => mkSyms(t), SyntaxError);
    }
    @test "should not allow a persistent name to be an argument"() {
        const t = 'function x = foo(x); persistent x; end';
        assert.throws(() => mkSyms(t), SyntaxError);
    }
    @test "should not allow a local to be redeclared as a global"() {
        const t = 'function x = foo(x); x = 32; global x; end';
        assert.throws(() => mkSyms(t), SyntaxError);
    }
    @test "should not allow a local to be redeclared as a persistent"() {
        const t = 'function x = foo(x); x = 32; persistent x; end';
        assert.throws(() => mkSyms(t), SyntaxError);
    }
    @test "should not allow a global to be redeclared as persistent"() {
        const t = 'function foo; global x; persistent x; end';
        assert.throws(() => mkSyms(t), SyntaxError);
    }
    @test "should not allow a persistent to be redeclared as global"() {
        const t = 'function foo; persistent x; global x; end';
        assert.throws(() => mkSyms(t), SyntaxError);
    }
    @test "should identify a pure read as a unknown"() {
        const p = mkSyms('function foo; x = fft(1:32); end');
        assertDefinition(p, 'foo', 'fft', [SymbolFlags.Unknown]);
    }
    @test "should allow a variable to be captured"() {
        const t = `
        function foo
          x = 2;
          function y = goo
             y = x;
          end
        end
        `;
        const p = mkSyms(t);
        assertDefinition(p, 'foo', 'x', [SymbolFlags.Captured, SymbolFlags.Local]);
        assertDefinition(p, 'foo:goo', 'x', [SymbolFlags.Free])
    }
    @test "should allow a variable to be captured even after the function definition"() {
        const t = `
        function foo
          function y = goo
            y = x;
          end
          x = 4;
        end`;
        const p = mkSyms(t);
        assertDefinition(p, 'foo', 'x', [SymbolFlags.Captured, SymbolFlags.Local]);
        assertDefinition(p, 'foo:goo', 'x', [SymbolFlags.Free])
    }
}
