#include <stdio.h>

int main()
{
  int size;
  puts("Enter the array size:");
  scanf("%d", &size);
  int array[size];
  int i;

  for (i = 0; i < size; i++)
  {
    puts("Enter the next element:");
    scanf("%d", &array[i]);
  }

  bubblesort(array, size);

  puts("Sorted array:");
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

void bubblesort(int array[], int size)
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
