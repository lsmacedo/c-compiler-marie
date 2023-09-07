void strcpy(char *dest, char *src)
{
  while (*src)
  {
    *dest = *src++;
    *dest++;
  }
  *dest = 0;
}
