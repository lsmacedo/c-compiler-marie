void strcpy(char *dest, char *src)
{
  while (*src)
  {
    *dest = *src++;
    *dest++;
  }
  *dest = 0;
}

void strcat(char *dest, char *src)
{
  int i = 0;
  while (dest[i])
  {
    i++;
  }
  while (*src)
  {
    dest[i++] = *src++;
  }
  dest[i] = 0;
}