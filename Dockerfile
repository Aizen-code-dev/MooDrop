# ----------------------------
# Stage 1: Build
# ----------------------------
FROM maven:3.9.3-eclipse-temurin-17 AS build

# Set workdir
WORKDIR /app

# Copy pom.xml and download dependencies first (for caching)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code
COPY src ./src

# Build the Spring Boot JAR
RUN mvn clean package -DskipTests

# ----------------------------
# Stage 2: Run
# ----------------------------
FROM eclipse-temurin:17-jdk-jammy

# Set workdir
WORKDIR /app

# Copy the jar from build stage
COPY --from=build /app/target/*.jar app.jar

# Expose the port defined in application.properties
EXPOSE 8080

# Run the app
ENTRYPOINT ["java","-jar","app.jar"]
