# VibeCoding

An experiment in letting an AI agent author an entire application.

**The rules I set for myself:** I would write prompts and nothing else. No editing code by hand, no fixing a variable name, no nudging a file into place. If something was wrong, I had to ask for it to be changed and accept whatever came back. The code in this repository is exactly what came out of that process, left deliberately unreviewed — the point was to see what it produces, not to ship it.

It was built in a single session on 2025-11-27. The first commit message is `All created by prompt`.

## What it is

A small school management app: people (students and teachers) and courses, with CRUD on both.

| Layer | Stack |
|---|---|
| Backend | Spring Boot 3.1.4, Java 17, Spring Data JPA / Hibernate 6.2.9 |
| Database | H2, in-memory, `ddl-auto=update`, seeded on startup |
| Frontend | React 18.2, Create React App, axios, Bootstrap 5.3 |
| Build | Maven, Jacoco |
| Runtime | Docker Compose — `eclipse-temurin:17-jdk-jammy` + `nginx:stable-alpine` |

About 1,580 lines of source across 34 files: 13 Java classes, 2 test classes, 5 React components. (The repository itself is much larger, because `node_modules/` and `target/` were committed — there is no `.gitignore`. That is part of the artifact too.)

## Running it

```bash
docker compose up --build
```

Frontend on `http://localhost:3000`, API on `http://localhost:8080/api`. The database seeds itself with 4 teachers, 20 students and 5 courses on startup.

> ⚠️ **Do not expose this.** The H2 console is reachable without authentication at `/h2-console`, which means anyone who can reach port 8080 can run arbitrary SQL. A comment in `application.properties` claims the production profile disables it. The configuration does the opposite. This is one of the findings, not an oversight I later fixed.

## What came out well

Worth saying, because it is the interesting part: the code does not look bad.

- The backend layering is conventional and readable — controller → service → repository, DTOs at the boundary, constructor injection throughout.
- The tests are real. `@SpringBootTest` integration tests that exercise HTTP endpoints and assert on actual response content, including a full create → read → update → delete lifecycle. No mock theatre, no `assertTrue(true)`.
- 97% line coverage, reported by Jacoco.
- It builds and runs from a clean checkout.

If someone had handed me this as a pull request, I would have read the structure and been reasonably happy.

## What came out wrong

Everything that mattered was one layer above the code.

**The domain model collapsed the distinction it was supposed to make.** `Person` uses single-table inheritance with a discriminator column, and `Student` and `Teacher` are subclasses with no fields and no behaviour of their own. There is no `/api/students` and no `/api/teachers` — only `/api/persons`, which returns all three types in one list. The React app compensates by filtering on `personType` in the browser, doing the separation the API should have done.

**The update endpoint lies.** `PUT /api/persons/{id}` accepts a `personType` in the payload, returns `200 OK`, and silently discards it. The service copies only `firstName`, `lastName` and `email` onto the existing entity. Ask it to turn a student into a teacher and it will tell you it worked.

**Unchecked downcasts, duplicated four times.** `(Teacher) person` with no type check, in both `CourseService` and `CourseController`. Posting a course with a `teacherId` that points at a student produces a bare `ClassCastException` and an HTTP 500. There is no `@ControllerAdvice` anywhere in the codebase.

**The coverage number hid the gap.** 97% of lines, but 50% of branches — and all nine untested branches sit in the two classes containing those casts. `Student` and `Teacher` both report 100% coverage, and not one test ever asserts that creating a student produces a student. The tests were derived from the code, so they encode what the code already does rather than what I had asked for.

**Comments describing software that does not exist.** The H2 console comment above. A `// keep existing 4-arg constructor for compatibility` note in a repository with a single commit and no external consumers — and the constructor it preserves compatibility with has no callers at all. Dead code with an invented history to justify it.

**Silent failures in the UI.** Four `.catch(console.error)` handlers in `PersonCrud.js`: a failed create, update or delete produces no user-visible feedback at all. Elsewhere an error object is rendered directly, so the user sees `[object Object]`.

**It works partly by accident.** `frontend/Dockerfile` declares `ARG REACT_APP_API_URL` before the first `FROM`, so it resolves to an empty string and the compose build-arg is discarded. The hardcoded `http://localhost:8080/api` fallback wins, which happens to be correct for a browser. Had the ARG worked, a Docker-internal hostname would have been baked into a bundle running in the browser, and nothing would have loaded. The nginx reverse proxy that should have solved this properly is unused — and misrouted anyway.

## What I took from it

**The failure was never in the implementation.** Every individual piece was competently written. The problem was one level up: what the entities are, what must never be true of the data, what one row in a table actually represents. That layer is not code, and it is where the whole thing went wrong.

**Green tests told me nothing about it.** Coverage measures how much of the code you executed, not whether the code is the code you wanted. An agent that writes both the implementation and its tests will produce a suite that agrees with itself. High coverage on the wrong abstraction is a faster way to be confident about the wrong thing.

**Better-looking iterations are not converging iterations.** I asked for rewrites repeatedly. Each version was cleaner than the last and none of them fixed the model, because the model was never what I was critiquing — I was reacting to symptoms.

**It never asked.** I never specified the invariants that separate a student from a teacher, and the agent did not ask for them. It inferred a foundation, and then built on it faithfully and well.

The conclusion I carry into production work: define the model yourself, then put agents to work reviewing it. Author-then-review by the same system is a closed loop. Reviewers that ask *"is this the right shape?"* are worth more than authors that ask nothing at all.

## Modernizing the Stack: Adopting New Language & Framework Features

Rather than treating the modernization as a superficial version bump in `pom.xml` and `package.json`, the codebase was overhauled to actively leverage the features introduced in **Java 21–25**, **Spring Boot 3.4.2**, and modern **React 18**. Each upgrade directly targeted and resolved the architectural and structural flaws identified in the original experiment.

---

### 1. Java 25 & Modern Language Features (JEPs in Action)

#### Immutable Records & Compact Constructors (`PersonDto`, `CourseDto`)
Boilerplate JavaBean classes with mutable state and verbose getters/setters were replaced with immutable Java records paired with Jakarta Bean Validation (`@NotBlank`, `@Email`, `@Size`):

```java
public record CourseDto(
    Long id,
    @NotBlank @Size(max = 100) String name,
    Long teacherId,
    List<Long> studentIds
) {
    // Compact constructor normalizing null collections defensively
    public CourseDto {
        if (studentIds == null) {
            studentIds = List.of();
        }
    }
}
```

#### Pattern Matching for `switch`, Record Patterns & Unnamed Variables (JEP 440, 441, 456)
The original implementation relied on dangerous downcasts (`(Teacher) person`) and clunky `if-else` type inspections. This was overhauled in two key areas:

1. **Safe polymorphic entity creation with guards (`when`) and unnamed patterns (`_`):**
```java
// PersonController.java
private Person toEntity(PersonDto d) {
    Person p = switch (d) {
        case PersonDto(_, var first, var last, var email, var type) when "TEACHER".equals(type) ->
                new Teacher(first, last, email);
        case PersonDto(_, var first, var last, var email, var type) when "STUDENT".equals(type) ->
                new Student(first, last, email);
        case PersonDto(_, var first, var last, var email, _) ->
                new Person(first, last, email);
    };
    p.setId(d.id());
    return p;
}
```

2. **Elimination of unchecked downcasts in `CourseService`:**
```java
// CourseService.java - Resolving teacher assignment without ClassCastException
Person p = personRepository.findById(teacherId)
        .orElseThrow(() -> new IllegalArgumentException("Teacher not found"));

switch (p) {
    case Teacher t -> course.setTeacher(t);
    case Student _ -> throw new IllegalArgumentException("Cannot assign student as teacher");
    case Person _  -> throw new IllegalArgumentException("Unknown person type");
}
```

#### Sealed Hierarchies & Exhaustive Domain Events (JEP 409)
To model domain events cleanly, an `AcademicEvent` sealed interface was introduced. Because the hierarchy is sealed, pattern matching switches are guaranteed to be exhaustive by the compiler without requiring a fallthrough `default` clause:

```java
// AcademicEvent.java
public sealed interface AcademicEvent {
    Long courseId();

    record StudentEnrolledEvent(Long courseId, Long studentId, String courseName) implements AcademicEvent {}
    record TeacherAssignedEvent(Long courseId, Long teacherId, String courseName) implements AcademicEvent {}
    record CourseCreatedEvent(Long courseId, String courseName, Long teacherId) implements AcademicEvent {}
}

// AcademicAuditService.java - Compiler-checked exhaustiveness & record deconstruction
public String describeEvent(AcademicEvent event) {
    return switch (event) {
        case StudentEnrolledEvent(var courseId, var studentId, var courseName) ->
                "Student #" + studentId + " was enrolled in '" + courseName + "' (course #" + courseId + ")";
        case TeacherAssignedEvent(var courseId, var teacherId, _) ->
                "Teacher #" + teacherId + " assigned to course #" + courseId;
        case CourseCreatedEvent(var courseId, var name, _) ->
                "Course created: '" + name + "' (course #" + courseId + ")";
    };
}
```

#### Stream Gatherers (JEP 461 / JEP 473 — Java Preview)
Instead of manual partitioning loops, `Stream.gather()` is used to break down student enrollments into cohort windows using `Gatherers.windowFixed()`:

```java
// CourseService.java
public List<List<Student>> getStudentCohorts(Long courseId, int cohortSize) {
    Course course = courseRepository.findById(courseId)
            .orElseThrow(() -> new IllegalArgumentException("Course not found"));

    return course.getStudents().stream()
            .gather(Gatherers.windowFixed(cohortSize))
            .toList();
}
```

#### Sequenced Collections (JEP 431)
Entity collections now utilize standardized, symmetric sequence operations (`getFirst()`, `getLast()`, `reversed()`) instead of manual index calculations:

```java
// Course.java
public Student getFirstEnrolledStudent() {
    return students.isEmpty() ? null : students.getFirst();
}

public SequencedCollection<Student> getStudentsReversed() {
    return students.reversed();
}
```

#### Virtual Threads (JEP 444 — Project Loom)
- **Application-wide:** Enabled in `application.properties` with `spring.threads.virtual.enabled=true`, allowing Tomcat to handle each HTTP request on a lightweight Virtual Thread.
- **Dedicated Workload Executor:** `VirtualThreadService` dispatches concurrent background tasks using `Executors.newVirtualThreadPerTaskExecutor()`, demonstrating high-throughput non-blocking execution:

```java
// VirtualThreadService.java
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    List<Future<TaskResult>> futures = sanitizedTasks.stream()
            .map(task -> executor.submit(() -> {
                Thread current = Thread.currentThread(); // current.isVirtual() == true
                Thread.sleep(simulatedIoMs);
                return new TaskResult(task, current.isVirtual(), current.toString(), "Completed");
            }))
            .toList();
    return futures.stream().map(Future::get).toList();
}
```

#### Foreign Function & Memory (FFM) API (JEP 454 — Project Panama)
Replaces fragile JNI bridges with standard, type-safe native interop:
- **Foreign Functions:** Direct C-library downcall to libc `getpid` using `Linker.nativeLinker()` and `downcallHandle`.
- **Foreign Memory:** Safe off-heap memory allocation via `Arena.ofConfined()` and `MemorySegment` to compute 64-bit FNV-1a digests with deterministic deallocation:

```java
// NativeSystemBridge.java
try (Arena arena = Arena.ofConfined()) {
    byte[] bytes = input.getBytes(StandardCharsets.UTF_8);
    MemorySegment segment = arena.allocate(bytes.length);

    for (int i = 0; i < bytes.length; i++) {
        segment.set(ValueLayout.JAVA_BYTE, i, bytes[i]);
    }

    // High-speed off-heap byte iteration
    long hash = 0xcbf29ce484222325L;
    for (long offset = 0; offset < segment.byteSize(); offset++) {
        byte b = segment.get(ValueLayout.JAVA_BYTE, offset);
        hash ^= (b & 0xff);
        hash *= 0x100000001b3L;
    }
    return Long.toHexString(hash);
}
```

---

### 2. Spring Boot 3.4.2 & Architecture Refactoring

- **Centralized `@RestControllerAdvice`:** Introduced `GlobalExceptionHandler` to handle `IllegalArgumentException` (400), `MethodArgumentNotValidException` (400 with detailed field validation errors), and `DataIntegrityViolationException` (409 Conflict), completely eliminating unhandled 500 errors and stack trace leaks.
- **N+1 Query Elimination:** In `CourseService`, multiple single-entity lookups were replaced by single batch queries using `personRepository.findAllById(ids)` mapped in memory.
- **Server-Side Filtering via JPQL:** `PersonRepository` now queries specifically by type (`TYPE(p) = :type`) and case-insensitive prefix (`findByLastNameStartingWithIgnoreCase`), shifting filtering responsibility back to the database.
- **Production Profile Hardening:** `application-prod.properties` explicitly disables the H2 console (`spring.h2.console.enabled=false`), while Docker sets `SPRING_PROFILES_ACTIVE=prod`.

---

### 3. Frontend Architecture Modernization (React 18)

- **Custom Hook Separation (`usePersons`):** Extracted network requests, loading states, and filtering out of view components.
- **Race Condition Prevention:** Implemented request sequence tracking (`latestRequestIdRef`) to discard stale asynchronous search responses when typing rapidly.
- **Component Decomposition:** Broken down monolithic views into modular components (`PersonFormModal`, `PersonViewModal`).
- **Global User Feedback (`ToastContext`):** Replaced silent `.catch(console.error)` handlers and raw `[object Object]` displays with an interactive, multi-type toast notification system.
- **Internationalization (`I18nProvider`):** Added dynamic multi-language support (English, Spanish, French) with automatic browser locale detection and persistent user preferences.
- **Interactive `Java25Dashboard`:** Created a dedicated UI dashboard tab allowing users to trigger Virtual Threads live, visualize sequential vs. concurrent execution speedups, invoke off-heap native memory hashing, and monitor domain audit logs in real time.

---

### 4. Container & Infrastructure Fixes

- **Multi-Stage Non-Root Dockerfile:** Updated the Java runtime to OpenJDK 25 and created an unprivileged system user (`USER appuser`).
- **Docker Build-Arg Scope Fix:** Moved `ARG REACT_APP_API_URL` below the `FROM` declaration in `frontend/Dockerfile`, correctly passing environment variables into the React build bundle.
- **Reverse Proxy with Security Headers:** Configured `nginx` (`default.conf`) to forward `/api/` traffic to the backend container while injecting security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`).

---

## Status

Active & Modernized. While initially authored entirely by an unreviewed AI prompt experiment, this repository now serves as a production-grade showcase for modern Java 25 features, Virtual Threads, the FFM API, clean Spring Boot architecture, and modular React design.