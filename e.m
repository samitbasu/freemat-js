(1+2-3)^3

n = 512;
a = zeros([512,512]);
for (let i=0;i<512;i++) for (let j=0;j<512;j++) a.real[i*512+j] = i-j + ((i===j)? 1 : 0);
b = zeros([512,1]);
for (let i=0;i<512;i++) b.real[i] = i+ 5;
//b.real = [5,6,7];
c = mldivide(a,b,console.log);
d = transpose(mrdivide(transpose(b),transpose(a),console.log));


