a = require('./double.js');
p = a.make_array([3,3]);
p.real = [1,2,3,4,5,6,7,8,9];
q = p.resize([4,3]);
console.log(a.print(q));

