#ifndef __Dense_Solver_hpp__
#define __Dense_Solver_hpp__

#include "Complex.hpp"

namespace FM {
  void DSolve(int,int,int,double*,const double*, const double*, warning_cb);
  void SSolve(int,int,int,float*,const float*, const float*, warning_cb);
  void ZSolve(int,int,int,Complex<double>*,const Complex<double>*, const Complex<double>*, warning_cb);
  void CSolve(int,int,int,Complex<float>*,const Complex<float>*, const Complex<float>*, warning_cb);
}

#endif
