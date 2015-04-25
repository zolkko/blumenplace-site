---
title: Debugging emb-template
date: 2015-04-17
tags: gdb,cgdb,cortex-m
template: post.html
---

Just a quick note on how to actually debug an application using cgdb.

Typically what you do if you build a lab from ebc-template course is somthing similar to:

``` bash
cmake ../mbed-template/ -DCMAKE_TOOLCHAIN_FILE=../mbed-template/lm3s6965evb.cmake -DTOOLCHAIN_PATH=~/gcc-arm-none-eabi/bin -DQEMU_PATH=~/qemu-arm/bin
```

So in order to tell ```cmake``` that you actually need a debug build you need to add
``` bash
-DCMAKE_BUILD_TYPE=Debug
```
option.


Then start a gdbserver using

``` bash
make gdbserver
```
command. And connect to it using somthing like following command:

``` bash
cgdb -d ~/gcc-arm-none-eabi/bin/arm-none-eabi-gdb -- ./mbed-template.elf -ex "target remote :5022"
```

