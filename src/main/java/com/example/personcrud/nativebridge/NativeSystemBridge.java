package com.example.personcrud.nativebridge;

import org.springframework.stereotype.Service;

import java.lang.foreign.*;
import java.lang.invoke.MethodHandle;
import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * Demonstrates the Java Foreign Function & Memory (FFM) API (JEP 454).
 * Uses Arena and MemorySegment for safe off-heap allocation, and Linker
 * for native C function invocation without JNI.
 */
@Service
public class NativeSystemBridge {

    private final Linker linker = Linker.nativeLinker();
    private final MethodHandle cachedGetpidHandle;

    public NativeSystemBridge() {
        MethodHandle handle = null;
        try {
            SymbolLookup stdlib = linker.defaultLookup();
            MemorySegment getpidAddress = stdlib.find("getpid").orElse(null);
            if (getpidAddress != null) {
                FunctionDescriptor descriptor = FunctionDescriptor.of(ValueLayout.JAVA_INT);
                handle = linker.downcallHandle(getpidAddress, descriptor);
            }
        } catch (Throwable _) {
            handle = null;
        }
        this.cachedGetpidHandle = handle;
    }

    /**
     * Foreign Function invocation: downcall to native libc getpid() function.
     * Uses cached MethodHandle for maximum performance.
     */
    public long getNativeProcessId() {
        if (cachedGetpidHandle != null) {
            try {
                return (int) cachedGetpidHandle.invokeExact();
            } catch (Throwable _) {
                // Fallback
            }
        }
        return ProcessHandle.current().pid();
    }

    /**
     * Foreign Memory: Allocates off-heap native memory using an Arena,
     * writes bytes, computes an off-heap hash, and safely frees memory on exit.
     */
    public String calculateOffHeapDigest(String input) {
        if (input == null) input = "";
        // Bound input length to prevent unconstrained native off-heap allocation (DoS)
        if (input.length() > 4096) {
            input = input.substring(0, 4096);
        }
        try (Arena arena = Arena.ofConfined()) {
            byte[] bytes = input.getBytes(StandardCharsets.UTF_8);
            MemorySegment segment = arena.allocate(bytes.length);

            // Copy to off-heap memory
            for (int i = 0; i < bytes.length; i++) {
                segment.set(ValueLayout.JAVA_BYTE, i, bytes[i]);
            }

            // Compute 64-bit FNV-1a checksum over off-heap memory segment
            long fnvOffsetBasis = 0xcbf29ce484222325L;
            long fnvPrime = 0x100000001b3L;
            long hash = fnvOffsetBasis;
            for (long offset = 0; offset < segment.byteSize(); offset++) {
                byte b = segment.get(ValueLayout.JAVA_BYTE, offset);
                hash ^= (b & 0xff);
                hash *= fnvPrime;
            }

            return Long.toHexString(hash);
        }
    }

    public Map<String, Object> getDiagnostics(String sampleInput) {
        return Map.of(
                "nativeProcessId", getNativeProcessId(),
                "offHeapDigest", calculateOffHeapDigest(sampleInput),
                "osArch", System.getProperty("os.arch"),
                "osName", System.getProperty("os.name")
        );
    }
}
