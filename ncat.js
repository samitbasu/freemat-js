'use strict';

const dbl = require('./double');
const tst = require('./test_help');

let a1 = tst.randMat([2,3,3]);
let a2 = tst.randMat([2,1,3]);
let a3 = tst.randMat([2,5,3]);

let dim = 1;
let dp = [a1,a2,a3];

let maxdims = 0;
for (let d of dp) {
    maxdims = Math.max(d.dims.length,maxdims);
}
console.log("maxdims " + maxdims);

for (let d of dp) {
    for (let ndx=0;ndx < maxdims;ndx++)
	if ((ndx !== dim) && ((d.dims[ndx]|0) !== (dp[0].dims[ndx]|0)))
	    throw "Dimension mismatch";
}

let outputSize = dp[0].dims.slice(0);
let aggregated_size = 0;
for (let d of dp) {
    aggregated_size += d.dims[dim];
}
outputSize[dim] = aggregated_size;
console.log(outputSize);

// Calculate the page sizes
let pagesize = [];
let offsets = [];
for (let ndx=0;ndx<dp.length;ndx++) {
    let pagesze = 1;
    for (let j=0;j<=dim;j++) {
	pagesze *= dp[ndx].dims[j];
	console.log(` ${ndx} ${j} ${dp[ndx].dims[j]} ${dp[ndx].dims} ${pagesze}`);
    }
    pagesize[ndx] = pagesze;
    offsets[ndx] = 0;
}
console.log("page sizes " + pagesize);

let op = dbl.make_array(outputSize);
let outputOffset = 0;
let outputCount = op.length;

let k=0;
while (outputOffset < outputCount) {
    for (let ndx=0;ndx<pagesize[k];ndx++) {
	op.real[outputOffset+ndx] = dp[k].real[ndx+offsets[k]];
    }
    outputOffset += pagesize[k];
    offsets[k] += pagesize[k];
    k = (k+1) % dp.length;
}

console.log(dp);

for (let k of dp) {
    console.log("Element");
    tst.mat_print(k);
}
console.log("Result:");
tst.mat_print(op);
