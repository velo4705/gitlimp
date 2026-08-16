//go:build windows

package main

import "syscall"

// syscallSignalZero is defined for parity with the Unix build; the Windows
// process-liveness probe does not use signals, but the shared code path
// references the symbol so it must exist on every platform.
var syscallSignalZero = syscall.Signal(0)