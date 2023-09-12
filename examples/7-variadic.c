// Even though the stdarg lib isn't implemented yet, the compiler has support
// for variadic functions.
// The variable arguments can be accessed with a pointer by decrementing the
// last named parameter's address.

#include <stdio.h>

int sum(int count, ...)
{
  int total = 0;
  int *p = &count - 1;
  for (int i = 0; i < count; i++)
  {
    total = total + *p;
    p--;
  }
  return total;
}

int main()
{
  int a = 10;
  int b = 20;
  int c = 30;
  int x = sum(3, a, b, c);
  printf("%d + %d + %d = %d", a, b, c, x);
  return 0;
}
