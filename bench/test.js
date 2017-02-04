//Function that contains the pattern to be inspected (using an `eval` statement)
a = require('../double');
tst = require('../test_help');

function testcase(A, b) {
/*
    let Areal = A.real||0;
    let breal = b.real||0;
    const Alength = A.length;
    function addr(a,b) {
	return ((a||0) + (b||0));
    }
    for (let ndx=0;ndx < Alength;ndx++) {
	Areal[ndx] = addr(Areal[ndx]||0,breal||0)||0;
    }
*/
/*    function addr(a,b) {
	return (a+b);
    }

    for (let ndx=0;ndx<A.length;ndx++) {
	A.real[ndx] = addr(A.real[ndx],b.real);
    }
*/
    const Alength = A.length;
    for (let ndx=0;ndx<Alength;ndx++) {
	A.real[ndx] = (A.real[ndx]||0)+(b.real||0);
    }
}

function exampleFunction() {
    A = a.make_array([512,512,10]);
    b = a.make_scalar(1.5,0);
    testcase(A,b);
//    function addr(a,b) {
//	return (a + b);
//    }
//    for (let ndx=0;ndx<A.length;ndx++) {
//	A.real[ndx] = addr(A.real[ndx],b.real);
//    }
}

function printStatus(fn) {
    switch(%GetOptimizationStatus(fn)) {
        case 1: console.log("Function is optimized"); break;
        case 2: console.log("Function is not optimized"); break;
        case 3: console.log("Function is always optimized"); break;
        case 4: console.log("Function is never optimized"); break;
        case 6: console.log("Function is maybe deoptimized"); break;
        case 7: console.log("Function is optimized by TurboFan"); break;
        default: console.log("Unknown optimization status"); break;
    }
}

//Fill type-info
console.log(tst.time_it(exampleFunction));
// 2 calls are needed to go from uninitialized -> pre-monomorphic -> monomorphic
console.log(tst.time_it(exampleFunction));

%OptimizeFunctionOnNextCall(testcase);
//The next call
for (let g=0;g<10;g++) {
    console.log(tst.time_it(exampleFunction));
}

//Check
printStatus(testcase);
