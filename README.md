# Memviz
`Memviz` is a Visual Studio code extension designed to visualize the address space (stack, heap, variables, etc.)
of C programs.

It is primarily designed to help students of the [Introduction to Programming](https://github.com/geordi/upr-course) course at VSB-TUO.

## Installation

## Features
- stack trace visualization
- heap memory allocation tracking
- lazy loading of memory from the debugged process

## Planned features
- visualization of pointers
- visualization of structs
- visualization of arrays
- visualization of heap memory

## Unsupported features (for now)
- multiple threads
- bitfields
- enums

## Development
Install dependencies:
```bash
$ npm install
```

and then open the project in Visual Studio code and start debugging (F5) to test the extension.
