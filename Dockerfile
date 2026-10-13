FROM eclipse-temurin:latest AS build
WORKDIR /build

# Install Maven in build image
RUN apt-get update && apt-get install -y maven && rm -rf /var/lib/apt/lists/*

# Copy pom and sources
COPY pom.xml .
COPY src ./src

# Build the project
RUN mvn -B -DskipTests package

FROM eclipse-temurin:latest
WORKDIR /app

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy jar from build stage
COPY --from=build /build/target/person-crud-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "--enable-preview", "-jar", "/app/app.jar"]
