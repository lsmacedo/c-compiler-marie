#include <stdio.h>
#include <stdarg.h>

void printall(int count, ...)
{
  va_list args;
  va_start(args, count);

  for (int i = 0; i < count; i++)
  {
    int val = va_arg(args, int);
    printf("%d", val);
  }

  va_end(args);
}

int main()
{
  int a = 10;
  int b = 20;
  int c = 30;
  printall(3, a, b, c);
  return 0;
}
