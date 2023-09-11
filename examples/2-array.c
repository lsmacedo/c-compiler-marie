#include <stdio.h>

int main()
{
  int arraySize;
  puts("Informe o tamanho do array:");
  scanf("%d", &arraySize);
  int array[arraySize];
  for (int i = 0; i < arraySize; i++)
  {
    puts("Informe o próximo elemento:");
    scanf("%d", &array[i]);
  }
  int sum = arrayElementsSum(array, arraySize);
  printf("Soma dos elementos do array: %d", sum);
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
