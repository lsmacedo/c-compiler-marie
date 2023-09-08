// ---------- INPUT ---------- //

void _readunicode(char *ptr)
{
  char tmp;
  scan(&tmp);
  while (tmp)
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
    _readunicode(ptr);
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
    _readunicode(tmp);
    while (tmp[i])
    {
      c = tmp[i];
      c = c - 48;
      if (i == 0)
      {
        *ptr = 0;
      }
      if (i > 0)
      {
        *ptr = *ptr * 10;
      }
      *ptr = *ptr + c;
      i++;
    }
  }
}

// ---------- OUTPUT --------- //
void _printstr(char *str)
{
  while (*str)
  {
    print(*str++);
  }
}

void puts(char *str)
{
  _printstr(str);
  // Line break
  print(92);
  print(110);
}

void _reverse(char str[], int length)
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

void _itoa(int num, char str[], int base)
{
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
    if (rem > 9)
    {
      // TODO: improve regex to support "str[i++] = rem - 10 + 'a'"
      str[i] = rem - 10;
      str[i++] = str[i] + 'a';
    }
    if (rem < 10)
    {
      str[i++] = rem + '0';
    }
    num = num / base;
  }

  // If number is negative, append '-'
  if (isNegative)
  {
    str[i++] = '-';
  }

  str[i] = 0; // Append string terminator

  // Reverse the string
  _reverse(str, i);
}

void _printint(int num)
{
  char str[8];
  _itoa(num, str, 10);
  _printstr(str);
}

void _printhex(int num)
{
  char str[8];
  _itoa(num, str, 16);
  printf("0x%s", str);
}

void printf(char *str, int param)
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
        _printint(param);
      }
      if (*str == 's')
      {
        _printstr(param);
      }
      if (*str == 'c')
      {
        print(param);
      }
      if (*str == 'p')
      {
        _printhex(param);
      }
      if (*str == 'x')
      {
        _printhex(param);
      }
    }
    *str++;
  }
}
