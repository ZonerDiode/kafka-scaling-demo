# Project Overview
Demonstrates Kafka processing by having a Producer Java project send messages and a Consumer Java project with 
multiple instances reading messages. The Dashboard Express project hosts a web page to control the Producer and observe the Consumer activity.

# Architecture & Structure

## Folder Structure
```
kafka-scaling-demo/
├── producer-service/
│   └── src/main/java/com/example/producer/     # Business logic and API for sending Kafka messages
├── consumer-service/
│   └── src/main/java/com/example/consumer/     # Business logic for reading Kafka messages
├── dashboard-service/             				# Express server logic
│   ├── public/     							# HTML UI for control and observation
│   └── public/css/    							# Style Sheet for HTML page
├── docker-compose.yml			         		# Docker image orchestration
└── pom.xml 									# Parent POM for Java modules
```

### API Layer (`dashboard-service/`)
Handles Dashboard HTTP requests and monitors Kafka groups and message lag. Uses Express.js framework.
- `server.js` - Authentication endpoints

### Services Layer (`producer-service/src/main/java/com/example/producer`)
Contains Kafka orchestration methods and API for producing messages.
- `EventControlApi.java` - Rest endpoints for controlling message transmission
- `EventProducer.java` - ScheduledTask manager for starting async message sending tasks

### Services Layer (`producer-service/src/main/java/com/example/consumer`)
Contains methods for reading Kafka messages.
- `EventListener.java` - KafkaListener to receive messages

## Tech Stack
- Node.js 18+
- Express.js for API
- Java 21 for producer-service and consumer-service

# Coding Guidelines
- Use async/await, not callbacks
- Write tests for new features
- Use kafka.css for style updates