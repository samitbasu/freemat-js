a = require('./double');
tst = require('./test_help');

const rep_time = (func,reps) => {
    let sum = 0;
    for (let ndx = 0;ndx < reps;ndx++) {
	let t1 = tst.tic()*1000;
	func();
	let t2 = tst.tic()*1000;
	console.log("   elapsed time: " + (t2-t1));
	sum = sum + (t2-t1);
    }
    console.log("average: " + sum/reps);
}

const reps = 10;

A = a.make_array([512,512,10]);
console.log("func per point");
rep_time(() => {A = A.plus(a.make_scalar(1,0));}, reps);

console.log('loop custom');
rep_time(() => {
    b = a.make_scalar(1,0);
    for (let ndx=0;ndx<A.length;ndx++) {
	A.real[ndx] = A.real[ndx] + b.real;
    }
}, reps);

console.log('loop custom - fallback');
rep_time(() => {
    b = a.make_scalar(1,0);
    for (let ndx=0;ndx<A.length;ndx++) {
	A.real[ndx] = A.real[ndx]|0 + b.real;
    }
}, reps);

console.log('loop custom | fallback');
rep_time(() => {
    b = a.make_scalar(1,0);
    for (let ndx=0;ndx<A.length;ndx++) {
	A.real[ndx] = A.real[ndx] + b.real[ndx]|b.real;
    }
}, reps);

console.log('loop custom | function access');
rep_time(() => {
    b = a.make_scalar(1,0);
    foo = (b,ndx) => (b.real);
    for (let ndx=0;ndx<A.length;ndx++) {
	A.real[ndx] = A.real[ndx] + foo(b,ndx);
    }
}, reps);

console.log('loop custom | function access | default');
rep_time(() => {
    b = a.make_scalar(1,0);
    foo = (b,ndx) => (b.real|0);
    for (let ndx=0;ndx<A.length;ndx++) {
	A.real[ndx] = A.real[ndx] + foo(b,ndx);
    }
}, reps);

console.log('loop custom | function access | default, func arg');
rep_time(() => {
    b = a.make_scalar(1,0);
    foo = (b,ndx) => (b.real|0);
    adder = (A,B,foo) => {
	for (let ndx=0;ndx<A.length;ndx++) {
	    A.real[ndx] = A.real[ndx] + foo(B,ndx);
	}
    }
    adder(A,b,foo);
}, reps);

console.log('function per point external implementation');
rep_time(() => {
    b = a.make_scalar(1,0);
    function addr(a,b) {
	return (a + b);
    }
    for (let ndx=0;ndx<A.length;ndx++) {
	A.real[ndx] = addr(A.real[ndx],b.real);
    }
}, reps);
