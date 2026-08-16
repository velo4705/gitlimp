//go:build !windows

package main

import "syscall"

// syscallSignalZero is SIG_0, used purely to test whether a process exists.
var syscallSignalZero = syscall.Signal(0)