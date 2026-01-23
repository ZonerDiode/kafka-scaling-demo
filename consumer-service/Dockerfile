# ---- Stage 1: Build with Maven + JDK 21 ----
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /build

# Copy parent pom first
COPY pom.xml .

# Copy consumer-service module
COPY consumer-service/pom.xml ./consumer-service/
COPY consumer-service/src ./consumer-service/src

# Build only the consumer-service module
WORKDIR /build/consumer-service
RUN mvn -q -e -DskipTests clean package


# ---- Stage 2: Run with Java 21 ----
FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=build /build/consumer-service/target/consumer-*.jar app.jar

ENTRYPOINT ["java", "-jar", "app.jar"]
