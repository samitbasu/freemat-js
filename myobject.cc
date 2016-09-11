// myobject.cc
#include "myobject.h"

namespace demo {

using v8::Context;
using v8::Function;
using v8::FunctionCallbackInfo;
using v8::FunctionTemplate;
using v8::Isolate;
using v8::Local;
using v8::Number;
using v8::Object;
using v8::Persistent;
using v8::String;
using v8::Value;

Persistent<Function> MyObject::constructor;

  MyObject::MyObject(double value) : value_(nullptr) {
    value_ = (double*) calloc(size_t(value),sizeof(double));
  printf("Constructing with value %g, address = %p\n",value,this);
}

MyObject::~MyObject() {
  free(value_);
  printf("Destructing with address = %p\n",this);
}

void MyObject::Init(Local<Object> exports) {
  Isolate* isolate = exports->GetIsolate();

  // Prepare constructor template
  Local<FunctionTemplate> tpl = FunctionTemplate::New(isolate, New);
  tpl->SetClassName(String::NewFromUtf8(isolate, "MyObject"));
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  // Prototype
  NODE_SET_PROTOTYPE_METHOD(tpl, "plusOne", PlusOne);
  NODE_SET_PROTOTYPE_METHOD(tpl, "set", Set);

  constructor.Reset(isolate, tpl->GetFunction());
  exports->Set(String::NewFromUtf8(isolate, "MyObject"),
               tpl->GetFunction());
}

void MyObject::New(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();

  if (args.IsConstructCall()) {
    // Invoked as constructor: `new MyObject(...)`
    double value = args[0]->IsUndefined() ? 0 : args[0]->NumberValue();
    MyObject* obj = new MyObject(value);
    obj->Wrap(args.This());
    args.GetReturnValue().Set(args.This());
  } else {
    // Invoked as plain function `MyObject(...)`, turn into construct call.
    const int argc = 1;
    Local<Value> argv[argc] = { args[0] };
    Local<Context> context = isolate->GetCurrentContext();
    Local<Function> cons = Local<Function>::New(isolate, constructor);
    Local<Object> result =
        cons->NewInstance(context, argc, argv).ToLocalChecked();
    args.GetReturnValue().Set(result);
  }
}

  void MyObject::Set(const FunctionCallbackInfo<Value>& args) {
    MyObject* obj = ObjectWrap::Unwrap<MyObject>(args.Holder());
    if (args.Length() == 2) {
      double ndx = args[0]->IsUndefined() ? 0 : args[0]->NumberValue();
      double val = args[1]->IsUndefined() ? 0 : args[1]->NumberValue();
      obj->value_[size_t(ndx)] = val; // Check size and resize if needed
    }
  }

  void MyObject::PlusOne(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();

  MyObject* obj = ObjectWrap::Unwrap<MyObject>(args.Holder());
  obj->value_[0] += 1;

  args.GetReturnValue().Set(Number::New(isolate, obj->value_[0]));
}

}  // namespace demo
