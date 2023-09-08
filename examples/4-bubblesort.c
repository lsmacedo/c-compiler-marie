int main()
{
  int size;
  puts("Informe o tamanho do array:");
  scanf("%d", &size);
  int array[size];
  int i;

  for (i = 0; i < size; i++)
  {
    puts("Informe o próximo elemento:");
    scanf("%d", &array[i]);
  }

  bubbleSort(array, size);

  puts("Array ordenado:");
  for (i = 0; i < size; i++)
  {
    printf("%d\n", array[i]);
  }
}

void swap(int *x, int *y)
{
  int swapVar = *x;
  *x = *y;
  *y = swapVar;
}

void bubbleSort(int array[], int size)
{
  for (int counter = 0; counter < size; counter++)
  {
    for (int counter1 = 0; counter1 < size - 1; counter1++)
    {
      if (array[counter1] > array[counter1 + 1])
      {
        swap(&array[counter1], &array[counter1 + 1]);
      }
    }
  }
}
