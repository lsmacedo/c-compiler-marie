# Compiler

An extremely simple C compiler for [MARIE](https://marie.js.org/book.pdf) (Machine Architecture that is Really Intuitive and Easy).

![image](https://github.com/lsmacedo/c-compiler-marie/assets/29143487/d7704e67-01ce-4929-bb2c-eecbe1154ae6)

### Limitations

- Only a very small subset of C features is supported. It is still far from being able to compile a real-world program without modifications.
- The compiler is still at a very early stage and many bugs can happen during parsing or code generation.
- MARIE architecture supports 4K words of memory, which is a big limitation for the amount of instructions a program can have and how much space can be destined to the stack.

### Supported features

- `int` and `char` data types
- `+`, `-`, `/`, `%`, `++` and `--` arithmetic operators
- `*` and `&` pointer operators
- `{ }` syntax to initialize arrays
- `""` syntax to initialize strings
- `if`, `while` and `for` flow control statements

### Requirements

The project uses Yarn for the dependencies, so make sure you have Yarn and Node.js installed on your machine:

- Yarn: https://yarnpkg.com/
- Node.js: https://nodejs.org/

### Installation

1. Clone the repository and navigate to the project folder:

```shell
git clone https://github.com/lsmacedo/c-compiler-marie
cd c-compiler-marie
```

2. Install the dependencies:

```shell
yarn install
```

### Usage

To compile a `.c` file, use the `yarn compile` command with the following arguments:

- `-f <file>` (Required): File to be compiled
- `-o <file>`: Output file name (default: a.mas)
- `-v`: verbose mode

Example:

```shel
yarn compile -f examples/1-fibonacci.c
```

The generated MARIE code is printed in the console and can be executed in a simulator like this one: https://marie.js.org/
