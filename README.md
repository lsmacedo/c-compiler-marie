# Compiler

An extremely simple C compiler for [MARIE](https://marie.js.org/book.pdf) (Machine Architecture that is Really Intuitive and Easy).

![image](https://github.com/lsmacedo/c-compiler-marie/assets/29143487/d7704e67-01ce-4929-bb2c-eecbe1154ae6)

### Limitations

- Only a very small subset of C features is supported. It is still far from being able to compile a real-world program without modifications.
- The compiler is still at a very early stage and many bugs can happen during parsing or code generation.
- Applying optimizations to the generated code is not in scope for this project.

### Status

- **Data types:** The only supported data type supported so far is `int`.
- **Arrays:** One dimensional arrays are supported.
- **Arithmetic Expressions:** Addition and subtraction are the only supported arithmetic expressions so far.
- **Functions:** Function definitions and function calls are supported. Function parameters, return address and local variables are stored in the call stack. Recursion is supported.
- **Control Flow:** Control flow can currently be achieved with `if` and `while` statements.

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

To compile a `.c` file, use the `yarn compile` command, providing the input file as an argument. Example:

```shel
yarn compile examples/1-fibonacci.c
```

The generated MARIE code is printed in the console, and can be executed in a simulator like this one: https://marie.js.org/
