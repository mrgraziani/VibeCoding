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
