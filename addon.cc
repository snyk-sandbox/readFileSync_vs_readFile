#include <napi.h>
#include <string>

class ReadFileAsyncWorker : public Napi::AsyncWorker
{
public:
  ReadFileAsyncWorker(const Napi::Function& callback) : Napi::AsyncWorker(callback) {
    out = "";
  }

protected:
  void Execute() override
  {
    FILE* fp = fopen("a", "r");
    if (fp == NULL) {
        exit(EXIT_FAILURE);
    }

    char* line = NULL;
    size_t len = 0;
    while ((getline(&line, &len, fp)) != -1) {
        out.append(line);
    }
    fclose(fp);
    if (line) {
        free(line);
    }
  }

  void OnOK() override
  {
    Napi::Env env = Env();

    Callback().MakeCallback(
      Receiver().Value(),
      {
        env.Null(),
        Napi::String::New(env, out)
      }
    );
  }

  void OnError(const Napi::Error& e) override
  {
    Napi::Env env = Env();

    Callback().MakeCallback(
      Receiver().Value(),
      {
        e.Value(),
        env.Undefined()
      }
    );
  }

private:
  std::string out;
};


void SumAsyncCallback(const Napi::CallbackInfo& info) {
    Napi::Function cb = info[0].As<Napi::Function>();

    (new ReadFileAsyncWorker(cb))->Queue();
    return;
}


Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set(
    Napi::String::New(env, "read"),
    Napi::Function::New(env, SumAsyncCallback)
  );
  return exports;
}


NODE_API_MODULE(addon, Init)
