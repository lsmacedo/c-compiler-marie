#include <stdio.h>

int main()
{
  char name[30];
  int age;

  puts("Enter your name:");
  scanf("%s", name);

  puts("Enter your age:");
  scanf("%d", &age);

  printf("\nMy name is %s and I'm %d years old!", name, age);
}
