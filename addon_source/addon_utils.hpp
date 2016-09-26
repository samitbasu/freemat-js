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

  template <class I, class O, class T = double> 
  BLASMatrix<T> ObjectToBLASMatrixReal(I isolate, O arg, const char *name = "real") {
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

  template <class I, class O, class T = double>
  BLASMatrix<Complex<T> > ObjectToBLASMatrixComplex(I isolate, O arg) {
    auto context = isolate->GetCurrentContext();
    auto obj = arg->ToObject(context).ToLocalChecked();
    BLASMatrix<T> real_part(ObjectToBLASMatrixReal(isolate,obj,"real"));
    BLASMatrix<T> imag_part(ObjectToBLASMatrixReal(isolate,obj,"imag"));
    return BLASMatrixInterleave<T>(real_part,imag_part);
  }

  template <class T>
  void ObjectToBLASMatrix(Isolate *isolate, Value* obj, BLASMatrix<T> &o);

  template <>
  void ObjectToBLASMatrix(Isolate *isolate, Value* obj, BLASMatrix<double> &o) {
    o = ObjectToBLASMatrixReal(isolate,obj);
  }

  template <>
  void ObjectToBLASMatrix(Isolate *isolate, Value* obj, BLASMatrix<Complex<double> >&o) {
    o = ObjectToBLASMatrixComplex(isolate,obj);
  }
  
  template <class I, class T = double>
  Local<ArrayBuffer> BLASMatrixToBuffer(BLASMatrix<T> &mat, I isolate) {
    size_t len = mat.elements();
    T *c = (T*) (calloc(len,sizeof(T)));
    memcpy(c,mat.base(),len*sizeof(T));
    return ArrayBuffer::New(isolate, c, len*sizeof(T),
                            ArrayBufferCreationMode::kInternalized);
  }

  template <class I, class T = double>
  Local<ArrayBuffer> BLASMatrixComplexToBuffer(BLASMatrix<Complex<T> > &mat, I isolate) {
    size_t len = mat.elements();
    T *c = (T*) (calloc(len,2*sizeof(T)));
    memcpy(c,mat.base(),len*2*sizeof(T));
    return ArrayBuffer::New(isolate, c, len*2*sizeof(T),
                            ArrayBufferCreationMode::kInternalized);
  }
  
  using warning_cb = std::function<void(std::string)>;
  
}
#endif
