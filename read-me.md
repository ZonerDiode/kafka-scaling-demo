# Kafka Scaling Demonstration

A hands-on demonstration showing Kafka's scaling capabilities through observable stages.

## Project Structure

```
kafka-demo/
├── docker-compose.yml
├── producer/
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/main/java/Producer.java
├── consumer/
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/main/java/Consumer.java
└── backend/
    ├── Dockerfile
    ├── package.json
    ├── server.js
    └── public/
        └── index.html (dashboard)
```

## To Run:
cd kafka-scaling-demo
docker-compose up -d
# Open browser (for demo dashboard) to http://localhost:3000 
# Open browser (for kafka monitoring UI) to http://localhost:8080

## How It Works:

- Click Stage Button → Frontend calls /api/stage/X
- Backend receives request → Deletes/recreates topic with correct partitions
- Scales consumers → docker-compose up -d --scale consumer=4
- Restarts producer → With new KEY_STRATEGY environment variable
- Monitors metrics → Polls Kafka every 2 seconds
- Streams to dashboard → Via WebSocket, charts update in real-time

## Prerequisites

- Docker & Docker Compose
- Java 21+ (for local development)
- Maven (for building JARs)

## Demo Stages

### Stage 1: Single Partition (Limited Scalability)
- Demonstrates basic operation with single consumer
- Topic created with 1 partition
- Only 1 consumer actively consuming

### Stage 2: Hot Consumer
- Demonstrates bad key strategy that causes uneven distribution among partitions
- Partitions increased to 4
- Enables parallel consumption
- **Action:** Scale consumers with `docker-compose up -d --scale consumer=4`

### Stage 3: Consumer Group Balanced
- Demonstrates good key strategy that evenly distributes the messages across all partitions
- Partitions increased to 4
- Enables parallel consumption
- **Action:** Scale consumers with `docker-compose up -d --scale consumer=4`