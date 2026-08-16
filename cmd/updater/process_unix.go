//go:build !windows

package main

// processRunningWindows is never called on non-Windows platforms; it exists
// only so the shared code path in main.go compiles everywhere.
func processRunningWindows(pid int) bool { return false }
