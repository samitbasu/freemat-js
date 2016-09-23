#ifndef __Complex_hpp__
#define __Complex_hpp__

namespace FM {
  template <class T>
  struct Complex {
    T real = 0;
    T imag = 0;
    Complex() {}
    Complex(T r, T i) : real(r), imag(i) {}
  };
}

#endif
