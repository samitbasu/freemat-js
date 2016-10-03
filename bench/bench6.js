'use strict';

const dbl = require('./double');
let dim = 8;
const C = dbl.make_array([2*dim,dim]);
for (let i=1;i<=dim;i++) {
    C.set([i,i],1);
    C.set([dim+i,i],1);
}
const B = dbl.make_array([2*dim,4]);
for (let i=1;i<=2*dim;i++) {
    for (let j=1;j<=4;j++) {
        B.set([i,j],i*j);
    }
}
const D = dbl.matsolve(C,B);
console.log(dbl.print(D));
