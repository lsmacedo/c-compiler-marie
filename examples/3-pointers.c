int main()
{
  int x = 5;
  int *pointer = &x;

  print(x);
  print(*pointer);

  print(&x);
  print(pointer);

  print(x == *pointer);
  print(&x == pointer);

  *pointer = 6;

  print(x);
  print(*pointer);
}
