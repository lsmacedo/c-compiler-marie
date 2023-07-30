int main()
{
  int arraySize = scan();
  int array[arraySize];
  int i = 0;
  while (i < arraySize)
  {
    array[i] = scan();
    i = i + 1;
  }
  int sum = arrayElementsSum(array, arraySize);
  print(sum);
}

int arrayElementsSum(int array[], int arraySize)
{
  int i = 0;
  int sum = 0;
  while (i < arraySize)
  {
    sum = sum + array[i];
    i = i + 1;
  }
  return sum;
}
