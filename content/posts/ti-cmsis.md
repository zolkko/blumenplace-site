---
title: TI cmsis library is broken
date: 2015-03-26T00:00:00+03:00
tags: [cmsis,cortex-m,ti]
---

If you read this, most likely you have faced the same issue I did. It
means that most likely you have downloaded
[cmsis](http://www.ti.com/tool/cmsis_device_headers) implementation from one of the
biggest silicon manufacturer in the world - TI. And the library does not work. Even worth,
your toolchain cannot assemble it and failed on strex instruction.

```asm
strex r0, r0, [r1]
```

It seems like someone do not give a dump about specifications. Because it
cleary [states](http://infocenter.arm.com/help/index.jsp?topic=/com.arm.doc.dui0489e/Cihbghef.html) that
*For STREX, Rd must not be the same register as Rt, Rt2, or Rn.*

<!--more-->

So in order to fix this you need to replace all `strex` instructions with

```c
uint32_t result = 0;
__ASM volatile ("strexb %0, %2, [%1]" : "=&r" (result) : "r" (addr), "r" (value));
return result;
```

The important thing here is "=&" specificator. It forces GCC to substitute different register into second operand.
For more information on "=&" pleace see [over here](http://www.ibiblio.org/gferg/ldp/GCC-Inline-Assembly-HOWTO.html).


Better way
==========

Beside patching TI version, what is wrong in so many ways, it is way more convinient just to generate from
CMSIS-SVD file. One way to generate them is just to install Keil IDE trial, grab these files and proceed with gcc.

