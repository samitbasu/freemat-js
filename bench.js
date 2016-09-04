a = require('./double_scalar');
p = new a(3,4);
q = new a(6,0);
console.time('loop');
for (let i=0;i<1e8;i++) {
    const x1 = new a(2,2);
    const x2 = p.times(x1);
    const x3 = q.plus(x2);
    q = x3;
//    q = q.plus(p.times(new a(2,2)));
}
console.log(q);
console.timeEnd('loop');
