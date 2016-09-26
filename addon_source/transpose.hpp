#ifndef __transpose_hpp__
#define __transpose_hpp__

#include "Complex.hpp"
const int BLOCKSIZE = 100; // TODO - Optimize the transpose block size?

namespace FM {
  using ndx_t = size_t;
  
  template <class T, int block = BLOCKSIZE>
  inline void blocked_hermitian(const T *A, T *B, ndx_t N, ndx_t M)
  {
    for (ndx_t i=0;i<N;i+=block)
      for (ndx_t j=0;j<M;j+=block)
        for (ndx_t k=0;k<block;k++)
          for (int n=0;n<block;n++)
            if (((j+n) < M) && ((i+k) < N))
              B[(j+n)+M*(i+k)] = complex_conj(A[(i+k)+N*(j+n)]);
  }  
  
  template <class T, int block = BLOCKSIZE>
  inline void blocked_transpose(const T *A, T *B, ndx_t N, ndx_t M)
  {
    for (int i=0;i<N;i+=block)
      for (int j=0;j<M;j+=block)
        for (int k=0;k<block;k++)
          for (int n=0;n<block;n++)
            if (((j+n) < M) && ((i+k) < N))
              B[(j+n)+M*(i+k)] = A[(i+k)+N*(j+n)];
  }
}

#endif
