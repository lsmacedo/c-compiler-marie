int main()
{
  // Int
  int x = 5;
  print(-x);
  print(--x);
  print(x);
  print(x++);
  print(x);

  // Array item
  int array[] = {0, 5, 10};
  print(-array[1]);
  print(--array[1]);
  print(array[1]);
  print(array[1]++);
  print(array[1]);

  // Pointer
  int *pointer = &array[1];
  print(*pointer);
  print(-*pointer);
  print(--*pointer);
  print(*pointer);
  print(*pointer++);
  print(*pointer);
}