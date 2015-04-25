---
title: Cortex-M3 clock sources
date: 2015-03-25
tags: cortex-m,systick
template: post.html
---

As you may know, any digital circuit can be either combinational or sequential. And all
modern microcontroller, including lm3c, consists of circuits of both types.

A simplest example for combinational logic is just a boolean expression
like `B = not A`. This expression does not compute value of `B`, but rather states
that `B` is an inverted value of signal `A`. In electronics world this means that
once a signal comes to input `A` it is immediately appear on output `B`.

On other hand sequential logic requires and an additional input, which
moves circuit from one state to another. In microcontrollers an example of such an
additional signal is a clock.

<!-- cut -->

The microcontroller lm3s has a few base clock sources. IOSC - an internal oscillator
which run at 12Mhz. It does not require any external components to be used but on
other hand it is not accurate.

![ARM Cortex-M3 clock sources](/img/blog/cm3-clk.png)

MOSC - main oscillator. It is accurate but in oposite to IOSC it requires an external clock.
So in order to make use of it you need to connect either external crystal or clock-generator
to the controller. Internal 30kHz oscillator typically used during deep-sleep modes because
it has very low power consumption.

Main clock tree of the controller is depicted on the figure above. Such a complex clock
system allows you to choose that clocking scheme which is best fit to your current needs.
Initially, when the controller just have powered up, it uses IOSC as it system clock. So the
controller firmware (your application) can start executing without any external components.
During startup phase the application can reconfigure clock-system. For instance, it may enable
MOSC using external 6Mhz crystal. Then use MOSC as a source for 400Mhz PLL and finally
select 400Mhz/2/SYSDIV as a source for system clock. As you can see, in order to correctly
setup the clock-system the firmware need to write data into a bunch of different registers.
So to make developrs life a little bit easier CMSIS library for LM3s controllers provides
SystemInit function, which does typical clock initialization. And it’s behaviour can be
configured by changing settings in hw/lms_config.h file. Please note that despite clock
configuration is done during start-up phase the application can reconfigure clocks at any time.
For instance, you may want to switch to low power internal oscillator right before the
controller goes to sleep mode and then when it wakes up reset 40Mhz PLL as system clock.

