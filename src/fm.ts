import { FMArray } from './arrays';
import { plus, minus, times, mtimes, transpose, mldivide, mrdivide } from './math';
import { start } from 'repl';

function zeros(dims: number[]): FMArray {
    return new FMArray(dims);
}

// Wash type as we don't seem to have a definition for context
let local: any = start({
    prompt: "--> "
});

local.context.zeros = zeros;
local.context.plus = plus;
local.context.minus = minus;
local.context.times = times;
local.context.mtimes = mtimes;
local.context.transpose = transpose;
local.context.mldivide = mldivide;
local.context.mrdivide = mrdivide;

