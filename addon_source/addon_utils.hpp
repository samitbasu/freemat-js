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
  inline void ThrowE(I isolate, const char * msg) {
    isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, msg)));
  }

  template <class I, class O>
  inline bool GetBool(I isolate, O obj, const char *name) {
    auto context = isolate->GetCurrentContext();    
    auto val = obj->Get(context,String::NewFromUtf8(isolate, name)).ToLocalChecked();
    auto bval = val->ToBoolean(context).ToLocalChecked()->Value();
    return bval;
  }

  template <class I, class O>
  inline int GetInt(I isolate, O obj, const char *name) {
    auto context = isolate->GetCurrentContext();    
    auto val = obj->Get(context,String::NewFromUtf8(isolate, name)).ToLocalChecked();
    auto bval = val->ToNumber(context).ToLocalChecked()->Value();
    return bval;
  }

  template <class I, class O>
  inline std::vector<double> GetDoubleArray(I isolate, O obj, const char *name) {
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
  inline BLASMatrix<Complex<T> > BLASMatrixInterleave(const BLASMatrix<T> &r, const BLASMatrix<T> &i) {
    BLASMatrix<Complex<T> > ret(r.rows,r.cols);
    const size_t numel = r.rows*r.cols;
    Complex<T> *ptr = ret.base();
    const T* aptr = r.base();
    const T* bptr = i.base();
    for (size_t i=0;i<numel;i++)
      ptr[i] = Complex<T>(aptr[i],bptr[i]);
    return ret;
  }

  template <class T> 
  inline bool ObjectToBLASMatrixReal(BLASMatrix<T> &mat, Isolate * isolate, Value * arg, const char *name = "real") {
    auto context = isolate->GetCurrentContext();
    auto obj = arg->ToObject(context).ToLocalChecked();
    auto dims = GetDoubleArray(isolate,obj,"dims");
    if (dims.size() == 1) dims.push_back(1);
    if (dims.size() > 2) {
      ThrowE(isolate,"Argument to matrix operation is not 2D");
      return false;
    }
    mat = BLASMatrix<T>(dims[0],dims[1]);
    auto cnt = mat.rows*mat.cols;
    auto val = obj->Get(context,String::NewFromUtf8(isolate, name)).ToLocalChecked();
    if (val->IsFloat64Array() && (sizeof(T) == sizeof(double))) {
      ArrayBufferView *abv = ArrayBufferView::Cast(*val);
      abv->CopyContents(mat.base(),cnt*sizeof(double));
    } else {
      auto arr = val->ToObject(context).ToLocalChecked();
      for (int i=0;i<cnt;i++) 
        mat.base()[i] = arr->Get(context,i).ToLocalChecked()->ToNumber(context).ToLocalChecked()->Value();
    }
    return true;
  }

  template <class T = double>
  inline bool ObjectToBLASMatrixComplex(BLASMatrix<Complex<T> > &mat, Isolate * isolate, Value * arg) {
    auto context = isolate->GetCurrentContext();
    auto obj = arg->ToObject(context).ToLocalChecked();
    BLASMatrix<T> real_part;
    if (!ObjectToBLASMatrixReal(real_part,isolate,*obj,"real")) return false;
    BLASMatrix<T> imag_part;
    if (!ObjectToBLASMatrixReal(imag_part,isolate,*obj,"imag")) return false;
    mat = BLASMatrixInterleave<T>(real_part,imag_part);
    return true;
  }

  template <class T>
  inline bool ObjectToBLASMatrix(BLASMatrix<T> &mat, Isolate *isolate, Value* obj);

  template <>
  inline bool ObjectToBLASMatrix(BLASMatrix<double> &mat, Isolate *isolate, Value* obj) {
    return ObjectToBLASMatrixReal(mat,isolate,obj);
  }

  template <>
  inline bool ObjectToBLASMatrix(BLASMatrix<Complex<double> > &mat, Isolate *isolate, Value* obj) {
    return ObjectToBLASMatrixComplex(mat,isolate,obj);
  }

  template <class T>
  inline Local<Value> CArrayToTypedArray(T* p, int len, Isolate *isolate);

  template <>
  inline Local<Value> CArrayToTypedArray(double *p, int len, Isolate *isolate) {
    auto buff = ArrayBuffer::New(isolate, p, len*sizeof(double),
                                 ArrayBufferCreationMode::kInternalized);
    return Float64Array::New(buff,0,len);
  }
  
  template <class T>
  inline Local<Value> BLASMatrixToBuffer(Isolate *isolate, BLASMatrix<T> &mat);

  template <>
  inline Local<Value> BLASMatrixToBuffer(Isolate *isolate, BLASMatrix<double> &mat) {
    size_t len = mat.elements();
    double *c = (double*) (calloc(len,sizeof(double)));
    memcpy(c,mat.base(),len*sizeof(double));
    return CArrayToTypedArray(c, len, isolate);
  }

  template <class T>
  inline Local<Value> BLASMatrixToBufferReal(Isolate *isolate, BLASMatrix<Complex<T> >&mat) {
    size_t len = mat.elements();
    T *c_r = (T*) (calloc(len,sizeof(T)));
    const auto mp = mat.base();
    for (int i=0;i<len;i++) c_r[i] = mp[i].real;
    return CArrayToTypedArray(c_r, len, isolate);
  }

  template <class T>
  inline Local<Value> BLASMatrixToBufferImag(Isolate *isolate, BLASMatrix<Complex<T> > &mat) {
    size_t len = mat.elements();
    T *c_i = (T*) (calloc(len,sizeof(T)));
    const auto mp = mat.base();
    for (int i=0;i<len;i++) c_i[i] = mp[i].imag;
    return CArrayToTypedArray(c_i, len, isolate);
  }

  template <class T>
  inline Local<Value> MakeDimsArray(Isolate *isolate, BLASMatrix<T> &C) {
    // Build an array with the row and column dimensions of the matrix
    // as entries
    auto dim = Array::New(isolate);
    auto context = isolate->GetCurrentContext();
    dim->Set(context,0,Number::New(isolate, C.rows));
    dim->Set(context,1,Number::New(isolate, C.cols));
    return dim;
  }
  
  template <class T>
  inline Local<Value> ConstructArray(Isolate *isolate, Local<Function> cb, BLASMatrix<T> &C) {
    // Call the array constructor
    const unsigned argc = 2;
    Local<Value> argv[argc] = {MakeDimsArray(isolate, C),
                               BLASMatrixToBuffer(isolate,C)};
    auto context = isolate->GetCurrentContext();
    auto recv = context->Global();
    return cb->Call(context,recv,argc,argv).ToLocalChecked();
  }

  template <class T>
  inline Local<Value> ConstructArray(Isolate *isolate, Local<Function> cb, BLASMatrix<Complex<T> >  &C) {
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
