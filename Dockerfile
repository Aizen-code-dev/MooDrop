# ----------------------------
# Stage 1: Build with Maven + MS OpenJDK 21
# ----------------------------
FROM maven:3.9.3-eclipse-temurin-21 AS build
# NOTE: Maven official image already has Java, but we can override if needed
# If you specifically want MS OpenJDK 21 in build, use: mcr.microsoft.com/openjdk/jdk:21-focal
# Maven needs Java, so ensure JDK installed

WORKDIR /app

# Copy pom.xml first to cache dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy all source code
COPY src ./src

# Build Spring Boot jar
RUN mvn clean package -DskipTests

# ----------------------------
# Stage 2: Runtime with MS OpenJDK 21
# ----------------------------
FROM mcr.microsoft.com/openjdk/jdk:21-focal

WORKDIR /app

# Copy the jar from build stage
COPY --from=build /app/target/*.jar app.jar

# Expose Spring Boot default port
EXPOSE 8080

# Run the jar
ENTRYPOINT ["java", "-jar", "app.jar"]
