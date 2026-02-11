# ----------------------------
# Stage 1: Build with MS OpenJDK 21 + Maven
# ----------------------------
FROM mcr.microsoft.com/openjdk/jdk:21-ubuntu AS build

# Set working directory
WORKDIR /app

# Install Maven (latest stable)
RUN apt-get update && \
    apt-get install -y maven git && \
    rm -rf /var/lib/apt/lists/*

# Copy pom.xml first to leverage Docker cache
COPY pom.xml .

# Download dependencies only
RUN mvn dependency:go-offline -B

# Copy the rest of the source code
COPY src ./src

# Build the Spring Boot JAR (skip tests)
RUN mvn clean package -DskipTests

# ----------------------------
# Stage 2: Runtime with MS OpenJDK 21 (smaller image)
# ----------------------------
FROM mcr.microsoft.com/openjdk/jdk:21-ubuntu

# Set working directory
WORKDIR /app

# Copy the built JAR from the build stage
COPY --from=build /app/target/*.jar app.jar

# Expose port 8080
EXPOSE 8080

# Run the Spring Boot app
ENTRYPOINT ["java","-jar","app.jar"]
