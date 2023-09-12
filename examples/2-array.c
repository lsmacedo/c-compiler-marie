#include <stdio.h>

int main()
{
  int arraySize;
  puts("Enter the array size:");
  scanf("%d", &arraySize);
  int array[arraySize];
  for (int i = 0; i < arraySize; i++)
  {
    puts("Enter the next element:");
    scanf("%d", &array[i]);
  }
  int sum = arrayElementsSum(array, arraySize);
  printf("Array elements sum: %d", sum);
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
