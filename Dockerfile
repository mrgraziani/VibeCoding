FROM maven:3.9.4-eclipse-temurin-17 AS build
WORKDIR /build

# Copy pom and sources
COPY pom.xml .
COPY src ./src

# Build the project
RUN mvn -B -DskipTests package

FROM eclipse-temurin:17-jdk-jammy
WORKDIR /app

# Copy jar from build stage (artifact coordinates from pom.xml)
COPY --from=build /build/target/person-crud-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/app.jar"]
