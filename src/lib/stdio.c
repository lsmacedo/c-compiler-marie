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

void printf(char *str, ...)
{
  int i = 0;
  while (*str)
  {
    if (*str != '%')
    {
      __print(*str);
    }
    if (*str == '%')
    {
      i++;
      *str++;
      if (*str == 'd')
      {
        int *arg = &str - i;
        printint(*arg);
      }
      if (*str == 's')
      {
        char *arg = &str - i;
        printstr(*arg);
      }
      if (*str == 'c')
      {
        char *arg = &str - i;
        __print(*arg);
      }
      if (*str == 'p')
      {
        int *arg = &str - i;
        printhex(*arg);
      }
      if (*str == 'x')
      {
        int *arg = &str - i;
        printhex(*arg);
      }
    }
    *str++;
  }
}
