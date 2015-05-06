---
title: Building and debugging emb-template
date: 2015-04-17
tags: gdb,cgdb,cortex-m
template: post.html
---

Once you checked out https://github.com/DataArt/ebc-template repository and created a separate
directory for out-of-source build, you need to run a command similar to this:
```bash
cmake ../mbed-template/ -DCMAKE_TOOLCHAIN_FILE=../mbed-template/lm3s6965evb.cmake \
    -DTOOLCHAIN_PATH=~/gcc-arm-none-eabi/bin -DQEMU_PATH=~/qemu-arm/bin
```


The first argument of the *cmake* command specifies a directory that contains
*CMakeLists.txt* file - a file that holds project description, and defines rules of
how to compile and link the project.


*DCMAKE_TOOLCHAIN_FILE* argument specifies so called toolchain file. This file basically
redefines standard cmake definitions. It can define the way cmake actually invoke
particular command. For instance, if you need to use *arm-none-eabi-gcc* executable
insteard of *gcc*, this file is a right place to acomplish this.

<!-- cut -->

Argument *DTOOLCHAIN_PATH* is specific to ebc-template project. You may find it
usefull if you have a few arm-none-eabi toolchains installed in your system.
It allows you to set a path to *bin* directory of particular toolchain you want
to use during the build.

# Debugging an application

By default all projects undef ebc-template repository get compiled in "release" mode. This
means that the compiler will optimize an application code and will not include any debug
information into binary output. So later on you will not be able to debug your C/C++ code.


So in order to tell *cmake* that you actually need a debug build you need to add

``` bash
-DCMAKE_BUILD_TYPE=Debug
```
argument.

Then you can start a gdbserver using
``` bash
make gdbserver
```
command. Depending on whether you building an application for QEMU or TIVA launchpad
the command will execute either qemu in gdbserver mode or openocd gdbserver.


In either way then you can connect to the gdbserver by executing command:
``` bash
make cgdb
```
The command will start cgdb application and connect to gdbserver.


If you are connected to real hardware through openocd, the sequence of commands:
``` bash
monitor reset halt
load
monitor reset halt
break main
continue
```
will upload the binary image into microcontroller's flash memory, set a break point to the
*main* function and finally continue execution.


Unfortunatly by the moment qemu's gdbserver does not support *monitor reset* functionality
and so you need to restart qemu each time you recompile the application.

If you do not want to debug your application using TUI debugger like cgdb, another
option for you is to set up IDE with GUI.
For more details on thie please see [blog post](/blog/2015/03/23/cmake-and-ide-setup/).

