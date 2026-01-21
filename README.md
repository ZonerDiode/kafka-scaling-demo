# Kafka Scaling Demonstration

A hands-on demonstration showing Kafka's scaling techniques and pitfalls through observable stages.

![Screen Shot](assets/kafka-scale-demo.png)

## To Run:
Change to the directory you placed the code, then run docker compose:
- **cd kafka-scaling-demo**
- **docker compose up -d**
- **docker compose down -v** - when finished

After startup view the dashboard @ http://localhost:3000

Also includes standard kafka monitor @ http://localhost:8080

## Configure From Docker Compose file
To change settings, stop the containers (**docker compose down -v**) then edit these settings in docker-compose.yml:

### Producer
- **MILLISECONDS_BETWEEN_MESSAGES**: Controls the delay between messages, defaults to 1
- **NUMBER_OF_PARTITIONS**: How many partitions to use for the topic, defaults to 6

### Consumer
- **MILLISECONDS_SIMULATED_WORK**: This is how many milliseconds the consumer waits before getting another message, defaults to 5
- **replicas**: How many consumers to deploy, ideally at least as many as partitions, defaults to 6

## How It Works:

- Click Stage Button → Dashboard calls producer/api/run-stage-X
- Producer generates messages into the topic
- Consumers read messages → Simulate doing work
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
- Partitions divide messages 50% into one partition, rest are split between remaining partitions
- One partition starts to become overloaded

### Stage 3: Consumer Group Balanced
- Demonstrates balanced key strategy that evenly distributes the messages across all partitions
- Partitions dividing messages evenly with round-robin strategy.
- Even lag across partitions