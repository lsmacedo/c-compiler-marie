#include <stdio.h>

int main()
{
  int x = 5;
  int *pointer = &x;

  printf("%d\n%d\n", x, *pointer);
  printf("%p\n%p\n", &x, pointer);
  printf("%d\n%d\n", x == *pointer, &x == pointer);

  *pointer = 6;

  printf("%d\n%d\n", x, *pointer);
}
