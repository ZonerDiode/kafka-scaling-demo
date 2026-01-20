---
alwaysApply: true
---

# Project Context: Kafka Microservices

## Tech Stack
- **Language:** Java 21 (Use **Virtual Threads/Project Loom** features where applicable).
- **Framework:** Spring Boot 4.0.1 (Spring Kafka).
- **Build Tool:** Maven (Multi-module).
- **Dashboard:** Node.js (Express) for the frontend/control plane.

## Infrastructure
- **Kafka Broker:** `localhost:29092`
- **Serialization:** Preferred format is **JSON** for Kafka payloads.
- **Service Discovery:** Assume local execution for now.

## Coding Style & Patterns
- **Dependency Injection:** Use **Constructor Injection** exclusively; avoid `@Autowired` on fields.
- **Data Containers:** Use Java **Records** for DTOs and Kafka Event payloads.
- **Naming Convention:** - Kafka topics: `{service-name}.{event-type}.v1`
  - Consumer groups: `group-{service-name}`
- **Logging:** Use SLF4J with `@Slf4j` Lombok annotation.

## Project Architecture
- **producer-service:** Exposes REST endpoints to trigger events sent to Kafka.
- **consumer-service:** Listens to Kafka topics and persists data (or logs).
- **dashboard-service:** A Node.js app providing a UI to monitor event flow.

## Directory Map
- `producer-service/`: Spring Boot producer logic.
- `consumer-service/`: Spring Boot consumer logic.
- `dashboard-service/`: Node.js/JavaScript dashboard logic.