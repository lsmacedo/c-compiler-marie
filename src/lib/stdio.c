#include <stdlib.h>

// ---------- INPUT ---------- //
static void scanstr(char *ptr)
{
  char tmp;
  __scan(&tmp);
  while (tmp)
  {
    *ptr = tmp;
    *ptr++;
    __scan(&tmp);
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
    scanstr(ptr);
    return;
  }
  if (*str == 'c')
  {
    __scan(ptr);
    return;
  }
  if (*str == 'd')
  {
    char tmp[7];
    scanstr(tmp);
    *ptr = atoi(tmp);
  }
}

// ---------- OUTPUT --------- //
static void printstr(char *str)
{
  while (*str)
  {
    __print(*str++);
  }
}

static void printint(int num)
{
  char str[8];
  itoa(num, str, 10);
  printstr(str);
}

static void printhex(int num)
{
  char str[8];
  itoa(num, str, 16);
  printf("0x%s", str);
}

void puts(char *str)
{
  printstr(str);
  __print('\n');
}

void printf(char *str, int param)
{
  while (*str)
  {
    if (*str != '%')
    {
      __print(*str);
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
        __print(param);
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
