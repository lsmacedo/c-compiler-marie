#include <stdio.h>

int main()
{
  int x = 5;
  int *pointer = &x;

  printf("%d\n", x);
  printf("%d\n", *pointer);

  printf("%p\n", &x);
  printf("%p\n", pointer);

  printf("%d\n", x == *pointer);
  printf("%d\n", &x == pointer);

  *pointer = 6;

  printf("%d\n", x);
  printf("%d\n", *pointer);
}
