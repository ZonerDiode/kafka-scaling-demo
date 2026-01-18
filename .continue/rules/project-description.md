---
alwaysApply: true
---

## Project Description
This is a collections of Java v21 projects using Spring Boot 4.0.1 for producing and receiving events in a Kafka cluster.
- Kafka cluster lives at: localhost:19092,localhost:29092,localhost:39092

## Code Style & Guidelines 
- Follow Java coding standards.
- If not mentioned, assume Java 21.

## Project Structure
producer-service/
  src/
    main/
      java/com/example/producer     # Code
    resources/
      application.yml               # Configuration
  pom.xml                           # Maven information
consumer-service/
  src/
    main/
      java/com/example/consumer     # Code
    resources/
      application.yml               # Configuration
  pom.xml                           # Maven information
streams-service/

