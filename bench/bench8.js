'use strict';
const tst = require('../test_help');

class array {
    constructor(len) {
	if (len < 100) {
	    this.data = Array(len).fill(0);
	} else {
	    this.data = new Float64Array(len);
	}
	this.length = len;
    }
};

tst.rep_time(() => {
    const b = new array(1);
    const a = new array(512*512*10);
    let c = new array(512*512*10);
    for (let ndx=0;ndx < a.length;ndx++) {
	c.data[ndx] = a.data[ndx] + b.data[0];
    }
}, 10);

tst.rep_time(() => {
    const b = new array(1);
    const a = new array(512*512*10);
    let c = new array(512*512*10);
    function addr(a,b) {
	return a+b;
    }
    for (let ndx=0;ndx < a.length;ndx++) {
	c.data[ndx] = addr(a.data[ndx],b.data[0]);
    }
}, 10);


tst.rep_time(() => {
    const b = new array(1);
    const a = new array(512*512*10);
    let c = new array(512*512*10);
    function addr(a,b) {
	if ((a.length === 1) && (b.length === 1)) {
	    const dval = new array(1);
	    dval.data[0] = a.data[0] + b.data[0];
	    return dval;
	}
	return a+b;
    }
    for (let ndx=0;ndx < a.length;ndx++) {
        const aval = new array(1);
	const bval = new array(1);
	aval.data[0] = a.data[ndx];
	bval.data[0] = b.data[ndx];
	const cval = addr(aval,bval);
	c.data[ndx] = cval.data[0];
    }
}, 10);

