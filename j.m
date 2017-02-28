for i=1:10
%    41+-3*+7-14^2+a-b+a(32,2:4)+b{42,3}-c.(foo)+d.bar+e{3}(42).gar
%    c*[1,2,3;4,5,6];
a = a + i;
b = a.^2-3*a+[a,b]+-3i;
c(i) = i - 1;
if (c>3)
  c = c - 2;
elseif (c==3)
  c = c + 2;
else
  d = d + c;
end

end


