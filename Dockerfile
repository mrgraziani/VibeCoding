FROM eclipse-temurin:latest AS build
WORKDIR /build

# Install Maven in build image
RUN apt-get update && apt-get install -y maven && rm -rf /var/lib/apt/lists/*

# Copy pom.xml and source code
COPY pom.xml .
COPY src ./src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:latest
WORKDIR /app

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy jar from build stage
COPY --from=build /build/target/person-crud-0.0.1-SNAPSHOT.jar app.jar

# Run container as non-root unprivileged user for security
RUN groupadd -r appuser && useradd -r -g appuser -d /app appuser \
    && chown appuser:appuser /app/app.jar

USER appuser
ENV SPRING_PROFILES_ACTIVE=prod

EXPOSE 8080
ENTRYPOINT ["java", "--enable-preview", "-jar", "/app/app.jar"]
