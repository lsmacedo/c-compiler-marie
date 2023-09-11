# Compiler

An extremely simple C compiler for [MARIE](https://marie.js.org/book.pdf) (Machine Architecture that is Really Intuitive and Easy).

<img width="1624" alt="image" src="https://github.com/lsmacedo/c-compiler-marie/assets/29143487/08128c8a-89c3-4494-bf3c-63d0dddcad1c">

### Limitations

- Only a small subset of C features is supported. It is still far from being able to compile a real-world program without modifications.
- The compiler is still at a very early stage and many bugs can happen during parsing or code generation.
- MARIE architecture supports 4K words of memory, which is a big limitation for the amount of instructions a program can have and how much space can be destined to the stack.

### Features

- Data types `int` and `char`
- Arithmetic operators `+`, `-`, `*`, `/`, `%`, `++` and `--`
- Relational operators `==`, `!=`, `<`, `<=`, `>` and `>=`
- Logical operators `&&` and `||`
- Pointer operators `*` and `&`
- Flow control statements `if`, `while` and `for`
- Function calls working (recursion is supported)
- Initial support for macros and typedef
- `{ }` syntax to initialize arrays
- `""` syntax to initialize strings

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

To compile a `.c` file, use the `yarn compile` command with the file names. Example:

```shell
yarn compile hello.c world.c
```

The following parameters are supported:

- `-o <file>`: Output file name (default: a.mas)
- `-v`: verbose mode

The generated MARIE code is written by default into the file `a.mas` and can be executed in a simulator like this one: https://marie.js.org/
