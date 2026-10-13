# Security & Technical Note: Spring ASM ClassReader Patch

## Purpose
This directory contains a bytecode compatibility patch for `org.springframework.asm.ClassReader` used by Spring Boot 3.4.2.

## Technical Rationale
Spring Boot 3.4.2 bundles ASM 9.7 (`org.springframework.asm`). By default, ASM validates that class file major versions do not exceed the supported LTS version (up to Java 23/24). When the application is compiled with OpenJDK 25 (class file major version 69) and preview features enabled (`--enable-preview`), Spring's class-scanning mechanism fails during startup with:

```text
java.lang.IllegalArgumentException: Unsupported class file major version 69
```

## Patch Details
The binary `ClassReader.class` in this directory modifies the version boundary check at bytecode offset 6:
- **Original check:** `readShort(6) > 65/67` (throws `IllegalArgumentException: Unsupported class file major version ...`)
- **Patched check:** `readShort(6) > 85` (allows class files up to major version 85, permitting Java 25 version 69)

No other bytecode or method logic has been modified.

## Deprecation & Security Roadmap
- Once Spring Framework / Spring Boot officially ships with an updated ASM version that natively supports Java 25 class file versions, this precompiled class and its exclusion in `pom.xml` **must be completely removed**.
- Do not add additional binary files directly into `src/main/resources/`.
