#ifndef __Dense_Solver_hpp__
#define __Dense_Solver_hpp__

#include "Complex.hpp"
#include "addon_utils.hpp"
#include "MemPtr.hpp"
#include "LAPACK.hpp"
#include <string>

/***************************************************************************
 * Linear equation solver for real matrices
 ***************************************************************************/
#ifdef __APPLE__
#define TOCOMP(A) ((__CLPK_complex*)(A))
#define TOCOMPZ(A) ((__CLPK_doublecomplex*)(A))
#else
#define TOCOMP(A) (A)
#define TOCOMPZ(A) (A)
#endif

static inline void Tgesvx(char* FACT, char* TRANS, int * N, int * NRHS, 
                          float *A, int * LDA, float * AF, int * LDAF, 
                          int * IPIV, char * EQUED, float * R, float * C, 
                          float * B, int * LDB, float * X, int * LDX, 
                          float * RCOND, float * FERR, float * BERR,
                          float * WORK, int * IWORK, int * INFO) {
  sgesvx_(FACT,TRANS,N,NRHS,A,LDA,AF,LDAF,IPIV,EQUED,R,C,B,
          LDB,X,LDX,RCOND,FERR,BERR,WORK,IWORK,INFO);
}

static inline void Tgesvx(char* FACT, char* TRANS, int * N, int * NRHS, 
                          double *A, int * LDA, double * AF, int * LDAF, 
                          int * IPIV, char * EQUED, double * R, double * C, 
                          double * B, int * LDB, double * X, int * LDX, 
                          double * RCOND, double * FERR, double * BERR,
                          double * WORK, int * IWORK, int * INFO) {
  dgesvx_(FACT,TRANS,N,NRHS,A,LDA,AF,LDAF,IPIV,EQUED,R,C,B,
          LDB,X,LDX,RCOND,FERR,BERR,WORK,IWORK,INFO);
}

static inline void Tgesvx(char* FACT, char* TRANS, int * N, int * NRHS, 
                          FM::Complex<float> *A, int * LDA, FM::Complex<float> * AF, int * LDAF, 
                          int * IPIV, char * EQUED, float * R, float * C, 
                          FM::Complex<float> * B, int * LDB, FM::Complex<float> * X, int * LDX, 
                          float * RCOND, float * FERR, float * BERR,
                          FM::Complex<float> * WORK, float * RWORK, int * INFO) {
  cgesvx_(FACT, TRANS, N, NRHS, TOCOMP(A), LDA,  TOCOMP(AF), LDAF, IPIV, EQUED, R, C,  TOCOMP(B),
          LDB,  TOCOMP(X), LDX, RCOND, FERR, BERR,  TOCOMP(WORK), RWORK, INFO);
}

static inline void Tgesvx(char* FACT, char* TRANS, int * N, int * NRHS, 
                          FM::Complex<double> *A, int * LDA, FM::Complex<double> * AF, int * LDAF, 
                          int * IPIV, char * EQUED, double * R, double * C, 
                          FM::Complex<double> * B, int * LDB, FM::Complex<double> * X, int * LDX, 
                          double * RCOND, double * FERR, double * BERR,
                          FM::Complex<double> * WORK, double * RWORK, int * INFO) {
  zgesvx_(FACT, TRANS, N, NRHS, TOCOMPZ( A), LDA, TOCOMPZ(AF), LDAF, IPIV, EQUED, R, C,
          TOCOMPZ( B), LDB, TOCOMPZ( X), LDX, RCOND, FERR, BERR,
          TOCOMPZ( WORK), RWORK, INFO);
}

template <typename T>
static inline void solveLinEq(int m, int n, FM::Complex<T> *c, FM::Complex<T>* a, FM::Complex<T>* b, FM::warning_cb io) {
  if ((m == 0) || (n == 0)) return;
  //      COMPLEX*16         A( LDA, * ), AF( LDAF, * ), B( LDB, * ),
  //     $                   WORK( * ), X( LDX, * )
  char FACT = 'E';
  char TRANS = 'N';
  int N = m;
  int NRHS = n;
  FM::Complex<T>* A = a;
  int LDA = m;
  MemBlock<FM::Complex<T> > AF(LDA*N);
  int LDAF = m;
  MemBlock<int> IPIV(N);
  char EQUED;
  MemBlock<T> R(N);
  MemBlock<T> C(N);
  FM::Complex<T> *B = b;
  int LDB = m;
  FM::Complex<T> *X = c;
  int LDX = m;
  T RCOND;
  MemBlock<T> FERR(n);
  MemBlock<T> BERR(n);
  MemBlock<FM::Complex<T> > WORK(2*N);
  MemBlock<T> RWORK(2*N);
  int INFO;
  Tgesvx(&FACT, &TRANS, &N, &NRHS, A, &LDA, &AF, &LDAF, &IPIV, &EQUED, &R, &C, B,
	 &LDB, X, &LDX, &RCOND, &FERR, &BERR, &WORK, &RWORK, &INFO);
  if ((INFO == N) || (INFO == N+1) || (RCOND < lamch<T>())) {
    io(std::string("Matrix is singular to working precision.  RCOND = ") + std::to_string(RCOND));
  }
}

// Solve A*C = B, where A is m x m, and B is m x n, all quantities are real.
template <typename T>
static inline void solveLinEq(int m, int n, T *c, T* a, T *b, FM::warning_cb io) {
  if ((m == 0) || (n == 0)) return;
  char FACT = 'E';  char TRANS = 'N';
  int N = m;
  int NRHS = n;
  T* A = a;
  int LDA = m;
  MemBlock<T> AF(LDA*N);
  int LDAF = m;
  MemBlock<int> IPIV(N);
  char EQUED;
  MemBlock<T> R(N);
  MemBlock<T> C(N);
  T *B = b;
  int LDB = m;
  T *X = c;
  int LDX = m;
  T RCOND;
  MemBlock<T> FERR(n);
  MemBlock<T> BERR(n);
  MemBlock<T> WORK(4*N);
  MemBlock<int> IWORK(4*N);
  int INFO;
  Tgesvx(&FACT, &TRANS, &N, &NRHS, A, &LDA, &AF, &LDAF, &IPIV, &EQUED, &R, &C, B,
	 &LDB, X, &LDX, &RCOND, &FERR, &BERR, &WORK, &IWORK, &INFO);
  if ((INFO == N) || (INFO == N+1) || (RCOND < lamch<T>()))
    io(std::string("Matrix is singular to working precision.  RCOND = ") + std::to_string(RCOND));
}

// Solve A*C = B, where A is m x m, and B is m x n, all quantities are complex.


static inline void Tgelsy(int* M, int *N, int *NRHS, double* A, int *LDA,
                          double *B, int *LDB, int *JPVT, double* RCOND,
                          int *RANK, double *WORK, int* LWORK, int* INFO) {
  dgelsy_(M,N,NRHS,A,LDA,B,LDB,JPVT,RCOND,
          RANK,WORK,LWORK,INFO);
}

static inline void Tgelsy(int* M, int *N, int *NRHS, float* A, int *LDA,
                          float *B, int *LDB, int *JPVT, float* RCOND,
                          int *RANK, float *WORK, int* LWORK, int* INFO) {
  sgelsy_(M,N,NRHS,A,LDA,B,LDB,JPVT,RCOND,
          RANK,WORK,LWORK,INFO);  
}

static inline void Tgelsy(int* M, int *N, int *NRHS, FM::Complex<float>* A, int *LDA,
                          FM::Complex<float> *B, int *LDB, int *JPVT, float* RCOND,
                          int *RANK, FM::Complex<float> *WORK, int* LWORK, float* RWORK,
                          int* INFO) {
  cgelsy_(M,N,NRHS,TOCOMP(A),LDA,TOCOMP(B),LDB,JPVT,RCOND,
          RANK,TOCOMP(WORK),LWORK,RWORK,INFO);
}

static inline void Tgelsy(int* M, int *N, int *NRHS, FM::Complex<double>* A, int *LDA,
                          FM::Complex<double> *B, int *LDB, int *JPVT, double* RCOND,
                          int *RANK, FM::Complex<double> *WORK, int* LWORK, double* RWORK,
                          int* INFO) {
  zgelsy_(M,N,NRHS,TOCOMPZ(A),LDA,TOCOMPZ(B),LDB,JPVT,RCOND,
          RANK,TOCOMPZ(WORK),LWORK,RWORK,INFO);
}

/***************************************************************************
 * Least-squares solver for double matrices
 ***************************************************************************/

/**
 * Solve A * X = B in a least-squares sense, where A is m x n, and B is m x k.
 * C is n x k.
 */
template <typename T>
static inline void solveLeastSq(int m, int n, int k, T *c, T *a, T *b, FM::warning_cb io) {
  if ((m == 0) || (n == 0)) return;
  int M = m;
  int N = n;
  int NRHS = k;
  T *A = a;
  int LDA = m;
  //*  B       (input/output) DOUBLE PRECISION array, dimension (LDB,NRHS)
  int Bsize = (M > N) ? M : N;
  // This passing convention requires that we copy our source matrix
  // into the destination array with the appropriate padding.
  MemBlock<T> B(Bsize*NRHS);
  changeStride(&B,Bsize,b,m,m,NRHS);
  int LDB = Bsize;
  MemBlock<int> JPVT(N);
  T RCOND = lamch<T>();
  int RANK;
  T WORKSIZE;
  int LWORK;
  int INFO;
  LWORK = -1;
  Tgelsy(&M, &N, &NRHS, A, &LDA, &B, &LDB, &JPVT, &RCOND,
	 &RANK, &WORKSIZE, &LWORK, &INFO);
  LWORK = (int) WORKSIZE;
  MemBlock<T> WORK(LWORK);
  Tgelsy(&M, &N, &NRHS, A, &LDA, &B, &LDB, &JPVT, &RCOND,
	 &RANK, &WORK, &LWORK, &INFO);
  // Check the rank...
  if (M > N) {
    // Problem should be overdetermined, rank should be N
    if (RANK < N) {
      io(std::string("Matrix is rank deficient to machine precision.  RANK = ") + std::to_string(RANK));
    }
  } else
    // Problem should be underdetermined, rank should be M
    if (RANK < M) {
      io(std::string("Matrix is rank deficient to machine precision.  RANK = ") + std::to_string(RANK));
    }
  changeStride(c,n,&B,Bsize,n,k);
}

/***************************************************************************
 * Least-squares solver for complex matrices
 ***************************************************************************/

/**
 * Solve A * X = B in a least-squares sense, where A is m x n, and B is m x k.
 * C is n x k.
 */
template <typename T>
static inline void solveLeastSq(int m, int n, int k, FM::Complex<T> *c, FM::Complex<T> *a, FM::Complex<T> *b, FM::warning_cb io) {
  if ((m == 0) || (n == 0)) return;
  int M = m;
  int N = n;
  int NRHS = k;
  FM::Complex<T> *A = a;
  int LDA = m;
  int Bsize = (M > N) ? M : N;
  // This passing convention requires that we copy our source matrix
  // into the destination array with the appropriate padding.
  MemBlock<FM::Complex<T> > B(Bsize*NRHS);
  changeStride(&B,Bsize,b,m,m,NRHS);
  int LDB = Bsize;
  MemBlock<int> JPVT(N);
  T RCOND = lamch<T>();
  int RANK;
  FM::Complex<T> WORKSIZE;
  int LWORK;
  MemBlock<T> RWORK(2*N);
  int INFO;
  LWORK = -1;
  Tgelsy(&M, &N, &NRHS, A, &LDA, &B, &LDB, &JPVT, &RCOND,
	 &RANK, &WORKSIZE, &LWORK, &RWORK, &INFO);
  LWORK = (int) WORKSIZE.real;
  MemBlock<FM::Complex<T> > WORK(LWORK);
  Tgelsy(&M, &N, &NRHS, A, &LDA, &B, &LDB, &JPVT, &RCOND,
	 &RANK, &WORK, &LWORK, &RWORK, &INFO);
  // Check the rank...
  if (M > N) {
    // Problem should be overdetermined, rank should be N
    if (RANK < N)
      io(std::string("Matrix is rank deficient to machine precision.  RANK = ") + std::to_string(RANK));
  } else
    // Problem should be underderemined, rank should be M
    if (RANK < M) 
      io(std::string("Matrix is rank deficient to machine precision.  RANK = ") + std::to_string(RANK));
  changeStride(c,n,&B,Bsize,n,k);
}

namespace FM {
  template <class T>
  void DenseSolve(int m, int n, int k, T *c, const T *a, const T *b, warning_cb io)
  {
    MemBlock<T> A(m*n);
    memcpy(&A,a,m*n*sizeof(T));
    MemBlock<T> B(m*k);
    memcpy(&B,b,m*k*sizeof(T));
    if (m == n)
      solveLinEq(m,k,c,&A,&B,io);
    else
      solveLeastSq(m,n,k,c,&A,&B,io);
  }
}

#endif
