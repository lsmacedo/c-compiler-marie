#include <stdio.h>

int main()
{
  int input;

  puts("Informe um valor:");
  scanf("%d", &input);

  int x = recursive(input);
  int y = iterative(input);

  printf("x: %d\n", x);
  printf("y: %d", y);
}

int recursive(int n)
{
  if (n == 0)
  {
    return 0;
  }
  if (n == 1)
  {
    return 1;
  }
  return recursive(n - 1) + recursive(n - 2);
}

int iterative(int n)
{
  int t1 = 0;
  int t2 = 1;

  int nextTerm = t1 + t2;

  for (int i = 2; i < n; i++)
  {
    t1 = t2;
    t2 = nextTerm;
    nextTerm = t1 + t2;
  }

  return nextTerm;
}
