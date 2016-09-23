a = require('./double');
a.init();
mat = require('./build/Release/mat');
A = a.make_array([512,512,10]);
console.time('loop');
for (let z=1;z<=10;z++) {
    for (let i=1;i<=512;i++) {
        for (let j=1;j<=512;j++) {
            A.set([j,i,z],a.make_scalar(i-j,0));
        }
    }
}
console.timeEnd('loop');
for (let p=0;p<5;p++) {
    console.time('adder');
    A = a.make_scalar(1,0).plus(A);
    console.timeEnd('adder');
    console.time('adder2');
    A = A.plus(a.make_scalar(1,0));
    console.timeEnd('adder2');
    for (let i=0;i<5;i++) {
        let line = '';
        for (let j=0;j<5;j++) {
            line += A.real[j+i*512] + " ";
        }
        console.log(line);
    }
}
console.time('small');
A = a.make_array([4,4]);
for (let i=0;i<1e6;i++) {
    let B = a.make_array([4,4]);
    let C = a.make_array([4,4]);
    let D = a.make_scalar(1,0).plus(B);
}
console.timeEnd('small');


let N = 1000;
console.time('fill');
let C = a.make_array([N,N]);
let D = a.make_array([N,N]);
for (let i=1;i<N;i++) {
    for (let j=1;j<N;j++) {
        C.set([i,j],a.make_scalar(i,1));
        D.set([i,j],a.make_scalar(N*N-1-i,3));
    }
}
console.timeEnd('fill');

//console.time('matmul');
//let E = a.matmul(C,D);
//console.timeEnd('matmul');

//console.log(a.print(E));
console.time('gemm');
let G = a.matmul(C,D);
console.timeEnd('gemm');

let C1 = a.make_array([5,5]);
let D1 = a.make_array([5,1]);
for (let i=1;i<=5;i++) {
    C1.set([i,i],a.make_scalar(1,0));
    D1.set([i,1],a.make_scalar(i,0));
}
for (let i=1;i<=4;i++) {
    C1.set([i,i+1],a.make_scalar(1,0));
}
let E1 = a.matsolve(C1,D1);
console.log(a.print(E1));

// Compare with a manual matrix multiply
/*
let F = a.make_array([N,N]);
for (let r=0;r<N;r++) {
    for (let c=0;c<N;c++) {
        let accum = 0;
        for (let k=0;k<N;k++) {
            accum += C.get([r,k]).times(D.get([k,c]));
        }
//        console.log(accum);
        F.set([r,c],accum);
    }
}
*/
