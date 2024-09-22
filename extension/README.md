# Memory visualizer

This extension is designed to visualize the address space of (primarily C) programs.
It has been created as an education tool for the [Introduction to Programming](https://github.com/geordi/upr-course) at VSB-TUO, but it can be used as a general visualization tool.

> The extension is currently only compatible with x64 Linux programs and the GDB debugger.

![](./img/screen-1.png)

## How to use

Simply start a normal debugging session of a _C_ file (using e.g. `F5`) using the `GDB` debugger.
`Memviz` will then open a webview that will visualize the state of the program once it stops on a breakpoint.

The visualized components are interactive. You can e.g. expand/collapse stack frames, displays byte values of scalar
values or change the start index of array elements that are displayed.

You can also pan the canvas using the middle mouse button and zoom using the mouse wheel.

## Features

- Stack trace visualization
  - Stack frames
  - Scalars (integers, floats, chars)
  - Arrays
  - Pointers
- Heap memory allocation tracking
- Lazy loading of memory from the debugged process
- Simple tracking of variable initialization
  - Note that the initialization tracking is offset by one line, i.e. the variable is assumed to be initialized on the line where it is declared.

## Planned/WIP features

- Structs
- Strings (both inline array and string pointers)
- Heap memory

## Unsupported features

- Multiple threads
- Bitfields
- Enums

## Development

1. Install dependencies:
   ```bash
   $ npm install
   ```
2. Open the project in Visual Studio code and start debugging (F5) to test the extension.
