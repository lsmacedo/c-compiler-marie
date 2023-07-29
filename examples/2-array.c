int main() {
  int arraySize = scan();
  int array[arraySize];
  int i = 0;
  int sum = 0;
  while (i < arraySize) {
    array[i] = scan();
    i = i + 1;
  }
  i = 0;
  while (i < arraySize) {
    sum = sum + array[i];
    i = i + 1;
  }
  print(sum);
}
