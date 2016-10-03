a = require('../double');
tst = require('../test_help');

A = a.make_array([4096,4096]);

console.log("Slice getting");
tst.rep_time(() => {
    for (let ndx=0;ndx < 4096;ndx++) {
	let B = A.slice(ndx*4096,[4096,1]);
    }
},10);
