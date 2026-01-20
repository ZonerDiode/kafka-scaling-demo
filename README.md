# Kafka Scaling Demonstration

A hands-on demonstration showing Kafka's scaling capabilities through observable stages.

## Project Structure

```
kafka-scaling-demo/
├── docker-compose.yml
├── producer-service/
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/main/java/com/example/producer Classes
├── consumer-service/
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/main/java/com/example/consumer Classes
└── dashboard-service/
    ├── Dockerfile
    ├── package.json
    ├── server.js
    └── public/
        └── index.html (dashboard)
```

## To Run:

- cd kafka-scaling-demo
- docker-compose up -d
- view the dashboard @ http://localhost:3000 
- view kafka monitor @ http://localhost:8080

## How It Works:

- Click Stage Button → Dashboard calls producer/api/stage/X
- Consumers → Simulate doing work
- Dashboard server monitors metrics → Polls Kafka every 2 seconds
- Dashboard server Streams to UI → Via WebSocket, charts update in real-time

## Prerequisites

- Docker & Docker Compose
- Java 21+ (for local development)
- Maven (for building JARs)

## Demo Stages

### Stage 1: Single Partition (Limited Scalability)
- Demonstrates basic operation with single consumer
- Topic with 1 overloaded partition
- Only 1 consumer actively consuming

### Stage 2: Hot Consumer
- Demonstrates bad key strategy that causes uneven distribution among partitions
- 3 Partitions dividing messages by bad key
- Enables parallel consumption

### Stage 3: Consumer Group Balanced
- Demonstrates good key strategy that evenly distributes the messages across all partitions
- 3 Partitions dividing messages evenly
- Enables parallel consumption