#ifdef __APPLE__
#include <Accelerate.h>
#else
#include <cblas.h>
#endif

#include "addon_utils.hpp"
#include "dense_solver.hpp"
#include "transpose.hpp"
#include <iostream>

using namespace v8;
using namespace FM;

void BLAS_gemm(int Arows, int Acols, int Bcols,
                const double *A, const double *B,
                double *C)
{
  cblas_dgemm(CblasColMajor,CblasNoTrans,CblasNoTrans,
              Arows,Bcols,Acols,1.0,A,Arows,B,Acols,0.0,C,Arows);
}

void BLAS_gemm(int Arows, int Acols, int Bcols,
               const Complex<double> *A,
               const Complex<double> *B,
               Complex<double> *C)
{
  double alpha[] = {1,0};
  double beta[] = {0,0};
  cblas_zgemm(CblasColMajor,CblasNoTrans,CblasNoTrans,Arows,Bcols,
              Acols,alpha,A,Arows,B,Acols,beta,C,Arows);
}

template <class T>
void TGEMM(const FunctionCallbackInfo<Value> &args) {
  auto isolate = args.GetIsolate();
  HandleScope handleScope(isolate);
  if (args.Length() != 3) {
    ThrowE(isolate,"Expected three arguments to GEMM function");
    return;
  }
  BLASMatrix<T> Amat;
  if (!ObjectToBLASMatrix<T>(Amat,isolate,*(args[0]))) return;
  BLASMatrix<T> Bmat;
  if (!ObjectToBLASMatrix<T>(Bmat,isolate,*(args[1]))) return;
  auto cb = Local<Function>::Cast(args[2]);
  BLASMatrix<T> Cmat(Amat.rows,Bmat.cols);
  if (Amat.cols != Bmat.rows) {
    ThrowE(isolate,"Columns and rows must match in matrix multiplication");
    return;
  }
  BLAS_gemm(Amat.rows, Amat.cols, Bmat.cols,
            Amat.base(), Bmat.base(), Cmat.base());
  args.GetReturnValue().Set(ConstructArray(isolate,cb,Cmat));
}


#define INSTANCE4(x) \
  void D ## x(const FunctionCallbackInfo<Value> &args) {T ## x<double>(args);} \
  void Z ## x(const FunctionCallbackInfo<Value> &args) {T ## x<Complex<double> >(args);}

INSTANCE4(GEMM)

template <class T>
void TSOLVE(const FunctionCallbackInfo<Value> &args) {
  auto isolate = args.GetIsolate();
  HandleScope handleScope(isolate);
  if (args.Length() != 4) {
    ThrowE(isolate,"Expected four arguments to DSOLVE function");
    return;
  }
  BLASMatrix<T> Amat;
  if (!ObjectToBLASMatrix<T>(Amat,isolate,*(args[0]))) return;
  BLASMatrix<T> Bmat;
  if (!ObjectToBLASMatrix<T>(Bmat,isolate,*(args[1]))) return;
  BLASMatrix<T> Cmat(Amat.cols, Bmat.cols);
  std::function<void(std::string) > cback = [=](std::string foo) {
    Local<Function> cb = Local<Function>::Cast(args[2]);
    const unsigned argc = 1;
    Local<Value> argv[argc] = {String::NewFromUtf8(isolate,foo.c_str())};
    cb->Call(Null(isolate), argc, argv);
  };
  auto ma = Local<Function>::Cast(args[3]);
  DenseSolve(Amat.rows,Amat.cols,Bmat.cols,Cmat.base(),Amat.base(),Bmat.base(),cback);
  args.GetReturnValue().Set(ConstructArray(isolate,ma,Cmat));
}

INSTANCE4(SOLVE)

// Should this code be auto-generated?

template <class T>
void TTRANSPOSE(const FunctionCallbackInfo<Value> &args) {
  auto isolate = args.GetIsolate();
  HandleScope handleScope(isolate);
  if (args.Length() != 2) {
    ThrowE(isolate,"Expected two arguments to DTRANSPOSE function");
    return;
  }
  BLASMatrix<T> Amat;
  if (!ObjectToBLASMatrix<T>(Amat,isolate,*(args[0]))) return;
  auto ma = Local<Function>::Cast(args[1]);
  BLASMatrix<T> Cmat(Amat.cols, Amat.rows);
  blocked_transpose(Amat.base(),Cmat.base(),Amat.rows,Amat.cols);
  args.GetReturnValue().Set(ConstructArray(isolate,ma,Cmat));
}

INSTANCE4(TRANSPOSE)

template <class T>
void THERMITIAN(const FunctionCallbackInfo<Value> &args) {
  auto isolate = args.GetIsolate();
  HandleScope handleScope(isolate);
  if (args.Length() != 2) {
    ThrowE(isolate,"Expect two arguments to ZHERMITIAN function");
    return;
  }
  BLASMatrix<T> Amat;
  if (!ObjectToBLASMatrix<T>(Amat,isolate,*(args[0]))) return;
  auto ma = Local<Function>::Cast(args[1]);
  BLASMatrix<T> Cmat(Amat.cols, Amat.rows);
  blocked_hermitian(Amat.base(),Cmat.base(),Amat.rows,Amat.cols);
  args.GetReturnValue().Set(ConstructArray(isolate,ma,Cmat));
}

void ZHERMITIAN(const FunctionCallbackInfo<Value> &args) {
  THERMITIAN<Complex<double> >(args);
}

void Init(Local<Object> exports) {
  NODE_SET_METHOD(exports, "DGEMM", DGEMM);
  NODE_SET_METHOD(exports, "ZGEMM", ZGEMM);
  NODE_SET_METHOD(exports, "DSOLVE", DSOLVE);
  NODE_SET_METHOD(exports, "ZSOLVE", ZSOLVE);
  NODE_SET_METHOD(exports, "DTRANSPOSE", DTRANSPOSE);
  NODE_SET_METHOD(exports, "ZTRANSPOSE", ZTRANSPOSE);
  NODE_SET_METHOD(exports, "ZHERMITIAN", ZHERMITIAN);
}

NODE_MODULE(mat, Init)

