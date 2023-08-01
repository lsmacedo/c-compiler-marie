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
  int array[2];
  array[1] = 5;
  print(-array[1]);
  print(--array[1]);
  print(array[1]);
  print(array[1]++);
  print(array[1]);

  // Pointer
  int *pointer = &x;
  print(*pointer);
  print(-*pointer);
  print(--*pointer);
  print(*pointer);
  print(*pointer++);
  print(*pointer);
}