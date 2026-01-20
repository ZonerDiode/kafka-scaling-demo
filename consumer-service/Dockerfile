# ---- Stage 1: Build with Maven + JDK 21 ----
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

COPY pom.xml .
RUN mvn -q -e -DskipTests dependency:go-offline

COPY src ./src
RUN mvn -q -e -DskipTests package


# ---- Stage 2: Run with Java 21 ----
FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=build /app/target/consumer-*.jar app.jar

ENTRYPOINT ["java", "-jar", "app.jar"]

