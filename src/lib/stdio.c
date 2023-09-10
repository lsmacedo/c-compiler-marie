// ---------- INPUT ---------- //
void readunicode(char *ptr)
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
    char tmp[7];
    readunicode(tmp);
    *ptr = atoi(tmp);
  }
}

// ---------- OUTPUT --------- //
void printstr(char *str)
{
  while (*str)
  {
    print(*str++);
  }
}

void printint(int num)
{
  char str[8];
  itoa(num, str, 10);
  printstr(str);
}

void printhex(int num)
{
  char str[8];
  itoa(num, str, 16);
  printf("0x%s", str);
}

void puts(char *str)
{
  printstr(str);
  // Line break
  print(92);
  print(110);
}

void printf(char *str, int param)
{
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
        printint(param);
      }
      if (*str == 's')
      {
        printstr(param);
      }
      if (*str == 'c')
      {
        print(param);
      }
      if (*str == 'p')
      {
        printhex(param);
      }
      if (*str == 'x')
      {
        printhex(param);
      }
    }
    *str++;
  }
}
