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

## Status

Archived. This is a record of an experiment, not a codebase to build on or a sample of how I write software.
