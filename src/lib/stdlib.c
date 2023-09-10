int atoi(char *str)
{
  int res = 0;
  for (int i = 0; str[i]; i++)
  {
    res = res * 10 + str[i] - 48;
  }
  return res;
}

void itoa(int num, char str[], int base)
{
  char chars[] = "0123456789abcdef";
  int i = 0;
  int isNegative = 0;
  int start;
  int end;

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
    str[i++] = chars[rem];
    num = num / base;
  }

  // If number is negative, append '-'
  if (isNegative)
  {
    str[i++] = '-';
  }

  str[i] = 0; // Append string terminator

  // Reverse the string
  start = 0;
  end = i - 1;
  while (start < end)
  {
    char temp = str[start];
    str[start] = str[end];
    str[end] = temp;
    end--;
    start++;
  }
}