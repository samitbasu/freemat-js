#ifdef __APPLE__
#include <Accelerate.h>
#else
#include <cblas.h>
#endif

#include "addon_utils.hpp"
#include "dense_solver.hpp"
#include <iostream>

using namespace v8;
using namespace FM;

void BLAS_dgemm(int Arows, int Acols, int Bcols,
                const double *A, const double *B,
                double *C)
{
  cblas_dgemm(CblasColMajor,CblasNoTrans,CblasNoTrans,
              Arows,Bcols,Acols,1.0,A,Arows,B,Acols,0.0,C,Arows);
}

void BLAS_zgemm(int Arows, int Acols, int Bcols,
                const Complex<double> *A,
                const Complex<double> *B,
                Complex<double> *C)
{
  double alpha[] = {1,0};
  double beta[] = {0,0};
  cblas_zgemm(CblasColMajor,CblasNoTrans,CblasNoTrans,Arows,Bcols,
              Acols,alpha,A,Arows,B,Acols,beta,C,Arows);
}

void DGEMM(const FunctionCallbackInfo<Value> &args) {
  auto isolate = args.GetIsolate();
  HandleScope handleScope(isolate);
  if (args.Length() != 2) 
    ThrowE(isolate,"Expected two arguments to GEMM function");
  auto context = isolate->GetCurrentContext();
  auto Amat(ObjectToBLASMatrix(isolate,args[0]));
  auto Bmat(ObjectToBLASMatrix(isolate,args[1]));
  BLASMatrix<double> Cmat(Amat.rows,Bmat.cols);
  if (Amat.cols != Bmat.rows)
    ThrowE(isolate,"Columns and rows must match in matrix multiplication");
  BLAS_dgemm(Amat.rows, Amat.cols, Bmat.cols,
             Amat.base(), Bmat.base(), Cmat.base());
  args.GetReturnValue().Set(BLASMatrixToBuffer(Cmat,isolate));
}

void ZGEMM(const FunctionCallbackInfo<Value> &args) {
  auto isolate = args.GetIsolate();
  HandleScope handleScope(isolate);
  if (args.Length() != 2) 
    ThrowE(isolate,"Expected two arguments to ZGEMM function");
  auto context = isolate->GetCurrentContext();
  auto Amat(ObjectToBLASMatrixComplex(isolate,args[0]));
  auto Bmat(ObjectToBLASMatrixComplex(isolate,args[1]));
  BLASMatrix<Complex<double> > Cmat(Amat.rows,Bmat.cols);
  if (Amat.cols != Bmat.rows)
    ThrowE(isolate,"Columns and rows must match in matrix multiplication");
  BLAS_zgemm(Amat.rows, Amat.cols, Bmat.cols,
             Amat.base(), Bmat.base(), Cmat.base());
  args.GetReturnValue().Set(BLASMatrixComplexToBuffer(Cmat,isolate));
}

void DSOLVE(const FunctionCallbackInfo<Value> &args) {
  auto isolate = args.GetIsolate();
  HandleScope handleScope(isolate);
  if (args.Length() != 3)
    ThrowE(isolate,"Expected three arguments to DSOLVE function");
  auto context = isolate->GetCurrentContext();
  auto Amat(ObjectToBLASMatrix(isolate,args[0]));
  auto Bmat(ObjectToBLASMatrix(isolate,args[1]));
  BLASMatrix<double> Cmat(Amat.cols, Bmat.cols);
  std::function<void(std::string) > cback = [=](std::string foo) {
    Local<Function> cb = Local<Function>::Cast(args[2]);
    const unsigned argc = 1;
    Local<Value> argv[argc] = {String::NewFromUtf8(isolate,foo.c_str())};
    cb->Call(Null(isolate), argc, argv);
  };
  DSolve(Amat.rows,Amat.cols,Bmat.cols,Cmat.base(),Amat.base(),Bmat.base(),cback);
  args.GetReturnValue().Set(BLASMatrixToBuffer(Cmat,isolate));
}

void ZSOLVE(const FunctionCallbackInfo<Value> &args) {
  auto isolate = args.GetIsolate();
  HandleScope handleScope(isolate);
  if (args.Length() != 3)
    ThrowE(isolate,"Expected three arguments to DSOLVE function");
  auto context = isolate->GetCurrentContext();
  auto Amat(ObjectToBLASMatrixComplex(isolate,args[0]));
  auto Bmat(ObjectToBLASMatrixComplex(isolate,args[1]));
  BLASMatrix<Complex<double> > Cmat(Amat.cols, Bmat.cols);
  std::function<void(std::string) > cback = [=](std::string foo) {
    Local<Function> cb = Local<Function>::Cast(args[2]);
    const unsigned argc = 1;
    Local<Value> argv[argc] = {String::NewFromUtf8(isolate,foo.c_str())};
    cb->Call(Null(isolate), argc, argv);
  };
  ZSolve(Amat.rows,Amat.cols,Bmat.cols,Cmat.base(),Amat.base(),Bmat.base(),cback);
  args.GetReturnValue().Set(BLASMatrixComplexToBuffer(Cmat,isolate));
}

void Init(Local<Object> exports) {
  NODE_SET_METHOD(exports, "DGEMM", DGEMM);
  NODE_SET_METHOD(exports, "ZGEMM", ZGEMM);
  NODE_SET_METHOD(exports, "DSOLVE", DSOLVE);
  NODE_SET_METHOD(exports, "ZSOLVE", ZSOLVE);
}

NODE_MODULE(mat, Init)

