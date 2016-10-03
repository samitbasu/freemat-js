a = require('../double');
p = a.make_scalar(3,4);
q = a.make_scalar(6,0);
console.time('loop');
for (let i=0;i<1e7;i++) {
    const x1 = a.make_scalar(2,2);
    const x2 = p.times(x1);
    const x3 = q.plus(x2);
    q = x3;
}
console.log(q);
console.timeEnd('loop');
