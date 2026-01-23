# ---- Stage 1: Build with Maven + JDK 21 ----
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /build

# Copy parent pom first
COPY pom.xml .

# Copy producer-service module
COPY producer-service/pom.xml ./producer-service/
COPY producer-service/src ./producer-service/src

# Build only the producer-service module
WORKDIR /build/producer-service
RUN mvn -q -e -DskipTests clean package


# ---- Stage 2: Run with Java 21 ----
FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=build /build/producer-service/target/producer-*.jar app.jar

ENTRYPOINT ["java", "-jar", "app.jar"]
