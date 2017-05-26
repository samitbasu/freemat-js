import { FMArray, FnMakeScalarReal, FnMakeScalarComplex } from './arrays';
import { plus, minus, times, mtimes, transpose, mldivide, mrdivide } from './math';
import { start } from 'repl';
import { JSWriter } from './jswalker';
import Tokenize from './scanner';
import { Parser } from './parser';
import { inspect } from 'util';
const vm = require('vm');

const sandbox = {
    mks: FnMakeScalarReal,
    plus: plus,
    minus: minus,
    times: times,
    mtimes: mtimes,
    transpose: transpose,
    mldivide: mldivide,
    mrdivide: mrdivide,
    mkc: FnMakeScalarComplex
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
    const script = new vm.Script(jscmd);
    script.runInContext(ctext);
    console.log(inspect(ctext));
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
