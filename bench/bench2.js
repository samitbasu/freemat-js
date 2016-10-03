a = require('../double');
a.init();
p = a.make_scalar(3);
q = a.make_scalar(6);
console.time('loop');
for (let i=0;i<1e8;i++) {
    const x1 = a.make_scalar(2);
    const x2 = p.times(x1);
    const x3 = q.plus(x2);
    q = x3;
}
console.log(q);
console.timeEnd('loop');
