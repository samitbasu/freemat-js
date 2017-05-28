import { FMArray, FnMakeScalarReal, FnMakeScalarComplex, Copy, Set } from './arrays';
import { rnaz, hermitian, plus, minus, times, mtimes, transpose, mldivide, mrdivide } from './math';
import { le, ge, lt, gt, eq, ne } from './math';
import { ncat } from './ncat';
import { start } from 'repl';
import { JSWriter } from './jswalker';
import Tokenize from './scanner';
import { Parser } from './parser';
import { inspect } from 'util';
import { ColonGenerator } from './colon';
const vm = require('vm');


function sv(x: FMArray): number {
    return x.real[0];
}

const sandbox = {
    mks: FnMakeScalarReal,
    plus: plus,
    minus: minus,
    times: times,
    mtimes: mtimes,
    transpose: transpose,
    mldivide: mldivide,
    mrdivide: mrdivide,
    mkc: FnMakeScalarComplex,
    ncat: ncat,
    console: console,
    hermitian: hermitian,
    ColonGenerator: ColonGenerator,
    Set: FMSet,
    le: le,
    ge: ge,
    lt: lt,
    gt: gt,
    eq: eq,
    ne: ne,
    sv: sv,
    rnaz: rnaz
};

const ctext = new vm.createContext(sandbox);

function zeros(dims: number[]): FMArray {
    return new FMArray(dims);
}

function myTranslator(cmd: string, context: any, filename: any, callback: any): void {
    const tok = Tokenize(cmd);
    const pars = new Parser(tok, cmd);
    const b = pars.block();
    console.log(inspect(b, { depth: 10 }));
    const jscmd = JSWriter(b);
    console.log(jscmd);
    const script = new vm.Script(jscmd);
    console.time('cmd');
    script.runInContext(ctext);
    console.log('that took',console.timeEnd('cmd'),' seconds');
    console.log(inspect(ctext));
    callback("");
    //    console.log(jscmd);
    //    eval(jscmd);
}

// Wash type as we don't seem to have a definition for context
let local: any = start({
    prompt: "--> ", eval: myTranslator
});

local.context.zeros = zeros;
local.context.plus = plus;
local.context.minus = minus;
local.context.times = times;
local.context.mtimes = mtimes;
local.context.transpose = transpose;
local.context.mldivide = mldivide;
local.context.mrdivide = mrdivide;
local.context.mks = FnMakeScalarReal;

function FMSet(a: FMArray, args: any[], value: FMArray): FMArray {
    if (args.length === 0) {
        Copy(value, a);
        return a;
    }
    if (args.length === 1) {
        let p = args[0];
        if (p.type === "array") {
            a = Set(a, p.index, value);
            return a;
        }
    }
    throw "Unhandled set case!";
}
