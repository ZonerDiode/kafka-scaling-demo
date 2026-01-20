# Kafka Scaling Demonstration

A hands-on demonstration showing Kafka's scaling techniques and pitfalls through observable stages.

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

- Click Stage Button → Dashboard calls producer/api/run-stage/X
- Consumers → Simulate doing work
- Dashboard server monitors metrics → Polls Kafka every 400 ms
- Dashboard server Streams to UI → Via WebSocket, charts update in real-time

## Prerequisites

- Docker & Docker Compose
- Java 21+ (for local development)
- Maven (for building JARs)

## Demo Stages

### Stage 1: Single Partition (Limited Scalability)
- Demonstrates basic operation with single consumer
- Topic with 1 overloaded partition
- 1 consumer actively consuming starts to fall behind

### Stage 2: Hot Consumer
- Demonstrates poor key strategy that causes uneven distribution among partitions
- 3 Partitions dividing messages 50%, 30%, 20%
- One partition starts to become overloaded

### Stage 3: Consumer Group Balanced
- Demonstrates balanced key strategy that evenly distributes the messages across all partitions
- 3 Partitions dividing messages evenly
- Low lag across partitions