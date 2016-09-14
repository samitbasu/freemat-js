#include <node.h>
#include <node_buffer.h>
#include <vector>
#include <uv.h>
#include <stdlib.h>
#include <string.h>

#ifdef __APPLE__
#include <Accelerate.h>
#else
#include <cblas.h>
#endif

using namespace v8;

template <class I>
void ThrowE(I isolate, const char * msg) {
  isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, msg)));
}

template <class I, class O>
bool GetBool(I isolate, O obj, const char *name) {
  auto context = isolate->GetCurrentContext();    
  auto val = obj->Get(context,String::NewFromUtf8(isolate, name)).ToLocalChecked();
  auto bval = val->ToBoolean(context).ToLocalChecked()->Value();
  return bval;
}

template <class I, class O>
int GetInt(I isolate, O obj, const char *name) {
  auto context = isolate->GetCurrentContext();    
  auto val = obj->Get(context,String::NewFromUtf8(isolate, name)).ToLocalChecked();
  auto bval = val->ToNumber(context).ToLocalChecked()->Value();
  return bval;
}

template <class I, class O>
std::vector<double> GetDoubleArray(I isolate, O obj, const char *name) {
  auto context = isolate->GetCurrentContext();
  auto val = obj->Get(context,String::NewFromUtf8(isolate, name)).ToLocalChecked();
  auto arr = val->ToObject(context).ToLocalChecked();
  int len = GetInt(isolate,arr,"length");
  // Protect against wonkiness
  if (len > 100) return std::vector<double>();
  std::vector<double> ret(len);
  for (int i=0;i<len;i++) {
    auto val = arr->Get(context,i).ToLocalChecked()->ToNumber(context).ToLocalChecked()->Value();
    ret[i] = val;
  }
  return ret;
}

template <class T>
struct Complex {
  T real = 0;
  T imag = 0;
  Complex() {}
  Complex(T r, T i) : real(r), imag(i) {}
};

template <class T>
struct BLASMatrix {
  int rows;
  int cols;
  std::vector<T> data;
  BLASMatrix(int r, int c) {
    rows = r;
    cols = c;
    data.resize(r*c);
  }
  size_t elements() const {return rows*cols;}
  const T* base() const {return &(data[0]);}
  T* base() {return &(data[0]);}
};

template <class T>
BLASMatrix<Complex<T> > BLASMatrixInterleave(const BLASMatrix<T> &r, const BLASMatrix<T> &i) {
  BLASMatrix<Complex<T> > ret(r.rows,r.cols);
  const size_t numel = r.rows*r.cols;
  Complex<T> *ptr = ret.base();
  const T* aptr = r.base();
  const T* bptr = i.base();
  for (size_t i=0;i<numel;i++)
    ptr[i] = Complex<T>(aptr[i],bptr[i]);
  return ret;
}

template <class I, class O, class T = double> 
BLASMatrix<T> ObjectToBLASMatrix(I isolate, O obj, const char *name = "real") {
  auto context = isolate->GetCurrentContext();
  auto dims = GetDoubleArray(isolate,obj,"dims");
  BLASMatrix<T> mat(dims[0],dims[1]);
  auto cnt = mat.rows*mat.cols;
  auto val = obj->Get(context,String::NewFromUtf8(isolate, name)).ToLocalChecked();
  if (val->IsFloat64Array()) {
    ArrayBufferView *abv = ArrayBufferView::Cast(*val);
    abv->CopyContents(mat.base(),cnt*sizeof(double));
  } else {
    auto arr = val->ToObject(context).ToLocalChecked();
    for (int i=0;i<cnt;i++) 
      mat.base()[i] = arr->Get(context,i).ToLocalChecked()->ToNumber(context).ToLocalChecked()->Value();
  }
  return mat;
}

template <class I, class O, class T = double>
BLASMatrix<Complex<T> > ObjectToBLASMatrixComplex(I isolate, O obj) {
  BLASMatrix<T> real_part(ObjectToBLASMatrix(isolate,obj,"real"));
  BLASMatrix<T> imag_part(ObjectToBLASMatrix(isolate,obj,"imag"));
  return BLASMatrixInterleave<T>(real_part,imag_part);
}

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
  auto A = args[0]->ToObject(context).ToLocalChecked();
  auto B = args[1]->ToObject(context).ToLocalChecked();
  auto Amat(ObjectToBLASMatrix(isolate,A));
  auto Bmat(ObjectToBLASMatrix(isolate,B));
  BLASMatrix<double> Cmat(Amat.rows,Bmat.cols);
  if (Amat.cols != Bmat.rows)
    ThrowE(isolate,"Columns and rows must match in matrix multiplication");
  BLAS_dgemm(Amat.rows, Amat.cols, Bmat.cols,
             Amat.base(), Bmat.base(), Cmat.base());
  size_t len = Cmat.elements();
  double *c = (double*) (calloc(len,sizeof(double)));
  memcpy(c,Cmat.base(),len*sizeof(double));
  auto buf = ArrayBuffer::New(isolate, c, len*sizeof(double),
                              ArrayBufferCreationMode::kInternalized);
  args.GetReturnValue().Set(buf);
}

void ZGEMM(const FunctionCallbackInfo<Value> &args) {
  auto isolate = args.GetIsolate();
  HandleScope handleScope(isolate);
  if (args.Length() != 2) 
    ThrowE(isolate,"Expected two arguments to ZGEMM function");
  auto context = isolate->GetCurrentContext();
  auto A = args[0]->ToObject(context).ToLocalChecked();
  auto B = args[1]->ToObject(context).ToLocalChecked();
  auto Amat(ObjectToBLASMatrixComplex(isolate,A));
  auto Bmat(ObjectToBLASMatrixComplex(isolate,B));
  BLASMatrix<Complex<double> > Cmat(Amat.rows,Bmat.cols);
  if (Amat.cols != Bmat.rows)
    ThrowE(isolate,"Columns and rows must match in matrix multiplication");
  BLAS_zgemm(Amat.rows, Amat.cols, Bmat.cols,
             Amat.base(), Bmat.base(), Cmat.base());
  size_t len = Cmat.elements();
  double *c = (double*) (calloc(len,2*sizeof(double)));
  memcpy(c,Cmat.base(),2*len*sizeof(double));
  auto buf = ArrayBuffer::New(isolate, c, 2*len*sizeof(double),
                              ArrayBufferCreationMode::kInternalized);
  args.GetReturnValue().Set(buf);
}

void Init(Local<Object> exports) {
  NODE_SET_METHOD(exports, "DGEMM", DGEMM);
  NODE_SET_METHOD(exports, "ZGEMM", ZGEMM);
}

NODE_MODULE(mat, Init)

