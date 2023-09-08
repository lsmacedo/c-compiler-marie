int main()
{
  // Int
  int x = 5;
  printf("%d\n", -x);
  printf("%d\n", --x);
  printf("%d\n", x);
  printf("%d\n", x++);
  printf("%d\n", x);

  // Array item
  int array[] = {0, 5, 10};
  printf("%d\n", -array[1]);
  printf("%d\n", --array[1]);
  printf("%d\n", array[1]);
  printf("%d\n", array[1]++);
  printf("%d\n", array[1]);

  // Pointer
  int *pointer = &array[1];
  printf("%d\n", *pointer);
  printf("%d\n", -*pointer);
  printf("%d\n", --*pointer);
  printf("%d\n", *pointer);
  printf("%d\n", *pointer++);
  printf("%d\n", *pointer);
}