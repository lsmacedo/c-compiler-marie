int main()
{
  int size = scan();
  int array[size];
  int i = 0;

  while (i < size)
  {
    array[i] = scan();
    i = i + 1;
  }

  bubbleSort(array, size);

  i = 0;
  while (i < size)
  {
    print(array[i]);
    i = i + 1;
  }
}

void bubbleSort(int array[], int size)
{
  int counter = 0;
  int counter1 = 0;
  int swapVar;
  while (counter < size)
  {
    while (counter1 < size - 1)
    {
      int counterPlusOne = counter1 + 1;
      if (array[counter1] > array[counterPlusOne])
      {
        swapVar = array[counter1];
        array[counter1] = array[counterPlusOne];
        array[counterPlusOne] = swapVar;
      }
      counter1 = counter1 + 1;
    }
    counter = counter + 1;
    counter1 = 0;
  }
}