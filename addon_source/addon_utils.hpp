#ifndef __addon_utils_hpp__
#define __addon_utils_hpp__

#include <node.h>
#include <node_buffer.h>
#include <vector>
#include <uv.h>
#include <stdlib.h>
#include <string.h>
#include "Complex.hpp"
#include <functional>

namespace FM {

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
  struct BLASMatrix {
    int rows;
    int cols;
    std::vector<T> data;
    BLASMatrix() : rows(0), cols(0), data() {
    }
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

  template <class T = double> 
  BLASMatrix<T> ObjectToBLASMatrixReal(Isolate * isolate, Value * arg, const char *name = "real") {
    auto context = isolate->GetCurrentContext();
    auto obj = arg->ToObject(context).ToLocalChecked();
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

  template <class T = double>
  BLASMatrix<Complex<T> > ObjectToBLASMatrixComplex(Isolate * isolate, Value * arg) {
    auto context = isolate->GetCurrentContext();
    auto obj = arg->ToObject(context).ToLocalChecked();
    BLASMatrix<T> real_part(ObjectToBLASMatrixReal(isolate,*obj,"real"));
    BLASMatrix<T> imag_part(ObjectToBLASMatrixReal(isolate,*obj,"imag"));
    return BLASMatrixInterleave<T>(real_part,imag_part);
  }

  template <class T>
  BLASMatrix<T> ObjectToBLASMatrix(Isolate *isolate, Value* obj);

  template <>
  BLASMatrix<double> ObjectToBLASMatrix(Isolate *isolate, Value* obj) {
    return ObjectToBLASMatrixReal(isolate,obj);
  }

  template <>
  BLASMatrix<Complex<double> > ObjectToBLASMatrix(Isolate *isolate, Value* obj) {
    return ObjectToBLASMatrixComplex(isolate,obj);
  }

  template <class T>
  Local<Value> CArrayToTypedArray(T* p, int len, Isolate *isolate);

  template <>
  Local<Value> CArrayToTypedArray(double *p, int len, Isolate *isolate) {
    auto buff = ArrayBuffer::New(isolate, p, len*sizeof(double),
                                 ArrayBufferCreationMode::kInternalized);
    return Float64Array::New(buff,0,len*sizeof(double));
  }
  
  template <class T>
  Local<Value> BLASMatrixToBuffer(Isolate *isolate, BLASMatrix<T> &mat);

  template <>
  Local<Value> BLASMatrixToBuffer(Isolate *isolate, BLASMatrix<double> &mat) {
    size_t len = mat.elements();
    double *c = (double*) (calloc(len,sizeof(double)));
    memcpy(c,mat.base(),len*sizeof(double));
    return CArrayToTypedArray(c, len, isolate);
  }

  template <class T>
  Local<Value> BLASMatrixToBufferReal(Isolate *isolate, BLASMatrix<Complex<T> >&mat) {
    size_t len = mat.elements();
    T *c_r = (T*) (calloc(len,sizeof(T)));
    const auto mp = mat.base();
    for (int i=0;i<len;i++) c_r[i] = mp[i].real;
    return CArrayToTypedArray(c_r, len, isolate);
  }

  template <class T>
  Local<Value> BLASMatrixToBufferImag(Isolate *isolate, BLASMatrix<Complex<T> > &mat) {
    size_t len = mat.elements();
    T *c_i = (T*) (calloc(len,sizeof(T)));
    const auto mp = mat.base();
    for (int i=0;i<len;i++) c_i[i] = mp[i].imag;
    return CArrayToTypedArray(c_i, len, isolate);
  }

  template <class T>
  Local<Value> MakeDimsArray(Isolate *isolate, BLASMatrix<T> &C) {
    // Build an array with the row and column dimensions of the matrix
    // as entries
    auto dim = Array::New(isolate);
    auto context = isolate->GetCurrentContext();
    dim->Set(context,0,Number::New(isolate, C.rows));
    dim->Set(context,1,Number::New(isolate, C.cols));
    return dim;
  }
  
  template <class T>
  Local<Value> ConstructArray(Isolate *isolate, Local<Function> cb, BLASMatrix<T> &C) {
    // Call the array constructor
    const unsigned argc = 2;
    Local<Value> argv[argc] = {MakeDimsArray(isolate, C),
                               BLASMatrixToBuffer(isolate,C)};
    auto context = isolate->GetCurrentContext();
    auto recv = context->Global();
    return cb->Call(context,recv,argc,argv).ToLocalChecked();
  }

  template <class T>
  Local<Value> ConstructArray(Isolate *isolate, Local<Function> cb, BLASMatrix<Complex<T> >  &C) {
    const unsigned argc = 3;
    Local<Value> argv[argc] = {MakeDimsArray(isolate, C),
                               BLASMatrixToBufferReal(isolate,C),
                               BLASMatrixToBufferImag(isolate,C)};
    auto context = isolate->GetCurrentContext();
    auto recv = context->Global();    
    return cb->Call(context,recv,argc,argv).ToLocalChecked();
  }

  using warning_cb = std::function<void(std::string)>;
  
}
#endif
