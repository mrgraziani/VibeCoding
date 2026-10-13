# ADR-001: Experimental Java 25 Runtime & Spring ASM Bytecode Compatibility Patch

## Status
**Accepted** (Architectural Showcase / Educational Technology Lab)

## Date
October 2026

## Context & Motivation
This repository serves as a reference case study comparing unconstrained AI generation (*"vibe coding"*) against **Senior & Staff Engineering Governance**. 

As part of Act III (*The Economics of Modernization*), the project deliberately pushes the boundaries of the Java ecosystem to evaluate next-generation platform capabilities:
- **Project Panama Foreign Function & Memory (FFM) API (JEP 454):** Safe off-heap memory management (`Arena`, `MemorySegment`) and C ABI downcalls without legacy JNI.
- **Stream Gatherers (JEP 461 / JEP 473):** Declarative stream windowing and cohort partitioning.
- **Project Loom Virtual Threads (JEP 444):** High-throughput unpinned HTTP concurrency.

To evaluate these bleeding-edge features in runtime, the application target is compiled with **OpenJDK 25 (Early Access) with `--enable-preview`**.

---

## Technical Problem
Spring Boot 3.4.2 bundles **ASM 9.7** repackaged under `org.springframework.asm`. ASM implements strict bytecode version verification at startup:
- Class file major version 65 corresponds to Java 21.
- Class file major version 67 corresponds to Java 23.
- Class file major version 69 corresponds to Java 25.

When Spring Boot component-scans classes compiled on JDK 25 with `--enable-preview`, ASM rejects the bytecode offset at offset 6:
```text
java.lang.IllegalArgumentException: Unsupported class file major version 69
```

---

## Architectural Decision & Implementation

### 1. The Bytecode Compatibility Bridge
Rather than abandoning Java 25 experimentation or monkey-patching external Maven repositories, a single-byte boundary patch was compiled into `src/main/resources/org/springframework/asm/ClassReader.class`:
- **Original condition:** `readShort(6) > 65/67` $\rightarrow$ throws `IllegalArgumentException`.
- **Patched condition:** `readShort(6) > 85` $\rightarrow$ allows class file versions through major version 85 (enabling Java 25 version 69).
- No method logic, security boundaries, or runtime execution behaviors were modified.

### 2. Strict Architectural Quarantine (Staff Governance)
To prevent bleeding-edge experimental complexity from destabilizing core enterprise domain logic:
1. **Module Isolation:** Native FFM interop is strictly restricted to `com.example.personcrud.nativebridge` and exposed exclusively through `/api/system/native-info`.
2. **Access Control (RBAC):** Mutation and execution endpoints in `/api/system/*` are restricted strictly to `ROLE_ADMIN` via Spring Security.
3. **Core Domain Purity:** Standard business entities (`Person`, `Student`, `Teacher`, `Course`) depend solely on stable Spring Boot, JPA, and standard Java language features.

---

## Enterprise Production Exit Strategy (The Staff Bar)
In a mission-critical enterprise production environment (e.g., banking, healthcare, fintech), checking binary `.class` patches into source control is a violation of supply-chain security governance.

A Staff Engineer mandates the following **production criteria**:
1. **LTS Baseline:** For mission-critical production deployments, the runtime must target **Java 21 LTS** (`eclipse-temurin:21-jre-alpine`).
2. **Deprecation Trigger:** When Spring Framework / Spring Boot officially ships with an updated ASM version that natively supports Java 25 class file versions, `src/main/resources/org/springframework/asm/ClassReader.class` and its exclusion in `pom.xml` **must be immediately deleted**.
3. **Automated Verification:** JaCoCo and Maven Surefire verify that no foreign class tampering occurs outside this documented boundary.
