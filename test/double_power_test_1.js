

a = dbl.make_scalar(-1);
b = dbl.make_scalar(0.5);
assert.isTrue(a.pow(b).equals(dbl.make_scalar(0,1)));

a = dbl.make_scalar(-1);
b = dbl.make_scalar(4);
assert.isTrue(a.pow(b).equals(dbl.make_scalar(1,0)));

a = dbl.make_scalar(0,1);
b = dbl.make_scalar(2);
assert.isTrue(a.pow(b).equals(dbl.make_scalar(-1,0)));

a = dbl.make_scalar(0,1);
b = dbl.make_scalar(3);
assert.isTrue(a.pow(b).equals(dbl.make_scalar(0,-1)));
