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

  template <class elem>
  static inline Complex<elem> complex_conj(const Complex<elem> &a) {
    return Complex<elem>(a.real, -a.imag);
  }
}

#endif
