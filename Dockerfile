# ----------------------------
# Stage 1: Build with MS OpenJDK 21 + Maven
# ----------------------------
FROM mcr.microsoft.com/openjdk/jdk:21 AS build

WORKDIR /app

# Install Maven
RUN apt-get update && \
    apt-get install -y maven git curl && \
    rm -rf /var/lib/apt/lists/*

# Copy pom.xml first to cache dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy all source code
COPY src ./src

# Build Spring Boot jar
RUN mvn clean package -DskipTests

# ----------------------------
# Stage 2: Runtime
# ----------------------------
FROM mcr.microsoft.com/openjdk/jdk:21

WORKDIR /app

# Copy jar from build stage
COPY --from=build /app/target/*.jar app.jar

# Expose Spring Boot default port
EXPOSE 8080

# Run the Spring Boot app
ENTRYPOINT ["java", "-jar", "app.jar"]
