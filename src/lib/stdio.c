// ---------- INPUT ---------- //

void readunicode(char *ptr)
{
  char tmp;
  scan(&tmp);
  // TODO: find an empty character supported by the simulator
  while (tmp != ',')
  {
    *ptr = tmp;
    *ptr++;
    scan(&tmp);
  }
  *ptr = 0;
}

void scanf(char *str, char *ptr)
{
  if (*str++ != '%')
  {
    return;
  }
  if (*str == 's')
  {
    readunicode(ptr);
    return;
  }
  if (*str == 'c')
  {
    scan(ptr);
    return;
  }
  if (*str == 'd')
  {
    char tmp[8];
    char c;
    int i = 0;
    readunicode(tmp);
    while (tmp[i])
    {
      c = tmp[i++];
      c = c - 48;
      if (*ptr)
      {
        *ptr = *ptr * 10;
      }
      *ptr = *ptr + c;
    }
  }
}

// ---------- OUTPUT --------- //

void puts(char *str)
{
  while (*str)
  {
    print(*str++);
  }
}

void reverse(char str[], int length)
{
  int start = 0;
  int end = length - 1;
  while (start < end)
  {
    char temp = str[start];
    str[start] = str[end];
    str[end] = temp;
    end--;
    start++;
  }
}

void itoa(int num, char str[])
{
  int base = 10;
  int i = 0;
  int isNegative = 0;

  /* Handle 0 explicitly, otherwise empty string is
   * printed for 0 */
  if (num == 0)
  {
    str[i++] = 48;
    str[i] = 0;
    return;
  }

  // Handle negative numbers
  if (num < 0)
  {
    isNegative = 1;
    num = -num;
  }

  // Process individual digits
  while (num != 0)
  {
    int rem = num % base;
    str[i++] = rem + 48;
    num = num / base;
  }

  // If number is negative, append '-'
  if (isNegative)
  {
    str[i++] = '-';
  }

  str[i] = 0; // Append string terminator

  // Reverse the string
  reverse(str, i);
}

void printint(int num)
{
  char str[8];
  itoa(num, str);
  puts(str);
}

void printf(char *str, int param[])
{
  int i = 0;
  while (*str)
  {
    if (*str != '%')
    {
      print(*str);
    }
    if (*str == '%')
    {
      *str++;
      if (*str == 'd')
      {
        printint(param[i++]);
      }
      if (*str == 's')
      {
        puts(param[i++]);
      }
      if (*str == 'c')
      {
        print(param[i++]);
      }
      if (*str == 'p')
      {
        print(param[i++]);
      }
    }
    *str++;
  }
}
