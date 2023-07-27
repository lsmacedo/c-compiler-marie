# Compiler

An extremely simple C compiler for [MARIE](https://marie.js.org/book.pdf) (Machine Architecture that is Really Intuitive and Easy).

### Disclaimer: Not a Professional Compiler

Please note that this compiler was born from the depths of spontaneity and chaos, devoid of any careful and thoughtful development process. The sole mission was to race against good sense and finish the implementation before logic could intervene and scream, "Why on earth are you doing this?!".

As a consequence, expect the parser to gleefully misconceive your intentions, taking ownership and giving a whole new meaning to your algorithm. Brace yourself as the generated code dances to the beat of its own drum, answering the profound question, "Just how inefficiently can this mindfully crafted C code be executed?".

But hey, let's be candid here – one might question the sanity of anyone seeking to dabble in generating MARIE code. I would fearlessly assume that whoever got this far is unafraid of the whimsical chaos that lies ahead.

With all that in mind, prepare yourself for the adventure to come. Fuel up with a cup of coffee (or maybe something stronger), and dare to delve deeper into the captivating abyss of this enigmatic endeavor.

### Supported Features

- **Integers:** This C compiler is generously sponsored by the `int` data type, and it promises to meet all your numerical needs. What? Floating-points? Why would you want to deal with that?
- **Arithmetic Operations:** Prepare for some thrilling math action with the holy duo of `+` and `-` operators! Things are kept refreshingly simple here; forget about the complexity of the real world!
- **Functions:** Define and call functions like a boss! No catch here. Thanks to my heroic efforts (including some sleepless nights), the call stack management works like a charm. You can even do recursion - but should you?
- **Control Flow:** When it comes to loops and conditionals, I've got you covered. Say hello to your trusty pals, `if` and `while`. They're here to meet the bare necessities for loops and conditionals.

### Installation

1. First, clone the repository and navigate to the project folder:

```shell
git clone https://github.com/lsmacedo/c-compiler-marie
cd c-compiler-marie
```

2. Finally, install the dependencies:

```shell
yarn install
```

> **_NOTE:_** The project uses Yarn for the dependencies, so make sure you have Yarn and Node.js installed on your machine:

- Yarn: https://yarnpkg.com/
- Node.js: https://nodejs.org/

### Usage

1. Begin by crafting your code in a file with the `.c` extension. Don't forget to keep your expectations low; this compiler may break your heart.
2. (Optional) Seek divine intervention from the programming gods. Offer prayers for the generated code to work as expected or simply for the compilation process not to fail at all. **_Disclaimer:_** I cannot guarantee the effectiveness of these suplications.
3. Now, the moment of truth! Use the npm script to run the compiler, providing the input file as an argument. Here's an example: `yarn compile examples/1-fibonacci.c`.
4. You've made it! Congratulations on surviving the C Compiler experience. Your code has now metamorphosed, and you can run the resulting MARIE code in a simulator like this one: https://marie.js.org/

### Known Limitations

- **No optimizations.** Like, at all. This compiler proudly generates the most inefficient code possible for any given input. Fear not, for efficiency is overrated anyway.
- **Incomplete.** Only a tiny, microscopic subset of C is currently supported. If you dare to compile a real program, be prepared to face the tears of disappointment.
- **Bugs.** These plagues are everywhere and they duplicate at each commit. There's absoutely nothing I can do about it. You, on the other hand, can always try to rewrite your C code in a way that better pleases the compiler.

### Contributing

Wow, your enthusiasm is really appreciated! Please e-mail me at lucasmacedo.se@gmail.com and I will kindly help you find better ways to use your time rather than contributing to this (probably already abandoned) project.
