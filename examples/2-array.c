int main()
{
  int arraySize = scan();
  int array[arraySize];
  for (int i = 0; i < arraySize; i++)
  {
    array[i] = scan();
  }
  int sum = arrayElementsSum(array, arraySize);
  print(sum);
}

int arrayElementsSum(int array[], int arraySize)
{
  int sum = 0;
  for (int i = 0; i < arraySize; i++)
  {
    sum = sum + array[i];
  }
  return sum;
}
