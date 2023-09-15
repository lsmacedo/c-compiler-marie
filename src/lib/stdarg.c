#define va_start(valist, lastarg) valist = &lastarg - 1;
#define va_arg(valist, type) \
  *valist;                   \
  valist = valist - 1;
#define va_end(valist) valist = 0;

typedef void *va_list;
