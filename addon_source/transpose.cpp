#include "transpose.hpp"
#include <unistd.h>


namespace FM {

  using ndx_t = size_t;
  
  template <class T, int block = BLOCKSIZE>
  static void blocked_hermitian(const T *A, T *B, ndx_t N, ndx_t M)
  {
    for (ndx_t i=0;i<N;i+=block)
      for (ndx_t j=0;j<M;j+=block)
        for (ndx_t k=0;k<block;k++)
          for (int n=0;n<block;n++)
            if (((j+n) < M) && ((i+k) < N))
              B[(j+n)+M*(i+k)] = complex_conj(A[(i+k)+N*(j+n)]);
  }
  
  
  template <class T, int block = BLOCKSIZE>
  static void blocked_transpose(const T *A, T *B, ndx_t N, ndx_t M)
  {
    for (int i=0;i<N;i+=block)
      for (int j=0;j<M;j+=block)
        for (int k=0;k<block;k++)
          for (int n=0;n<block;n++)
            if (((j+n) < M) && ((i+k) < N))
              B[(j+n)+M*(i+k)] = A[(i+k)+N*(j+n)];
  }

  void DTranspose(int N, int M, const double* A, double *B) {
    blocked_transpose(A,B,N,M);
  }

  void STranspose(int N, int M, const float* A, float *B) {
    blocked_transpose(A,B,N,M);
  }
  
  void ZTranspose(int N, int M, const Complex<double>* A, Complex<double> *B) {
    blocked_transpose(A,B,N,M);
  }

  void CTranspose(int N, int M, const Complex<float>* A, Complex<float> *B) {
    blocked_transpose(A,B,N,M);
  }

  void ZHermitian(int N, int M, const Complex<double>* A, Complex<double> *B) {
    blocked_hermitian(A,B,N,M);
  }

  void CHermitian(int N, int M, const Complex<float>* A, Complex<float> *B) {
    blocked_hermitian(A,B,N,M);
  }
}
