# Kafka Consumer Performance Tuning Guide

## Overview
This guide covers Kafka settings that can improve consumption rate and reduce processing time in your kafka-scaling-demo application.

---

## 1. Consumer Configuration Settings

### A. Fetch Settings (Most Impactful)

#### `fetch.min.bytes` (Default: 1)
**What it does**: Minimum data the broker should return for a fetch request
**Recommendation**: `fetch.min.bytes=1048576` (1 MB)
```yaml
# consumer-service/src/main/resources/application.yml
spring:
  kafka:
    consumer:
      properties:
        fetch.min.bytes: 1048576  # 1 MB
```
**Impact**: Reduces number of fetch requests, increases throughput
**Trade-off**: Slightly higher latency (waits for more data)

#### `fetch.max.wait.ms` (Default: 500)
**What it does**: Max time broker waits before sending data if fetch.min.bytes not met
**Recommendation**: `fetch.max.wait.ms=100` for low latency
```yaml
spring:
  kafka:
    consumer:
      properties:
        fetch.max.wait.ms: 100
```
**Impact**: Lower latency, more responsive to new messages
**Trade-off**: More frequent broker requests if producing slowly

#### `max.partition.fetch.bytes` (Default: 1 MB)
**What it does**: Max data per partition per fetch
**Recommendation**: `max.partition.fetch.bytes=2097152` (2 MB) for high throughput
```yaml
spring:
  kafka:
    consumer:
      properties:
        max.partition.fetch.bytes: 2097152  # 2 MB
```
**Impact**: Fetches more data per partition in each request
**Trade-off**: Higher memory usage

### B. Polling Settings

#### `max.poll.records` (Default: 500)
**What it does**: Max records returned in a single poll()
**Recommendation**: Increase to 1000-5000 for batch processing
```yaml
spring:
  kafka:
    consumer:
      max-poll-records: 2000
```
**Impact**: Processes more messages per poll cycle
**Trade-off**: Must process within max.poll.interval.ms
**Best for**: Fast processing (like your simulated work)

### C. Connection Settings

#### `session.timeout.ms` (Default: 45000 = 45 sec)
**What it does**: Max time between heartbeats before consumer is removed from group
**Recommendation**: `session.timeout.ms=30000` for faster rebalancing
```yaml
spring:
  kafka:
    consumer:
      properties:
        session.timeout.ms: 30000  # 30 seconds
```

#### `heartbeat.interval.ms` (Default: 3000 = 3 sec)
**What it does**: How often to send heartbeats
**Recommendation**: Keep at 1/3 of session.timeout.ms
```yaml
spring:
  kafka:
    consumer:
      properties:
        heartbeat.interval.ms: 10000  # 10 seconds (if session timeout is 30s)
```

---

## 2. Producer Configuration Settings

### `batch.size` (Default: 16384 = 16 KB)
**What it does**: Max size of batch before sending
**Recommendation**: `batch.size=65536` (64 KB) for high throughput
```yaml
# producer-service/src/main/resources/application.yml
spring:
  kafka:
    producer:
      batch-size: 65536  # 64 KB
```

### `linger.ms` (Default: 0)
**What it does**: Wait time before sending batch (allows batching)
**Recommendation**: `linger.ms=10` for higher throughput
```yaml
spring:
  kafka:
    producer:
      properties:
        linger.ms: 10  # 10 milliseconds
```
**Impact**: Better batching = higher throughput
**Trade-off**: Slight latency increase (10ms)

### `compression.type` (Default: none)
**What it does**: Compress messages before sending
**Recommendation**: `compression.type=lz4` or `snappy`
```yaml
spring:
  kafka:
    producer:
      compression-type: lz4
```
**Impact**: Reduced network usage, higher throughput
**Trade-off**: CPU overhead for compression/decompression

---

## 3. Broker Configuration Settings

### `num.network.threads` (Default: 3)
**What it does**: Threads handling network requests
**Recommendation**: 8-16 for high throughput brokers
```properties
# In docker-compose.yml for Kafka broker
environment:
  KAFKA_NUM_NETWORK_THREADS: 8
```

### `num.io.threads` (Default: 8)
**What it does**: Threads handling disk I/O
**Recommendation**: 16 for high I/O workloads
```properties
environment:
  KAFKA_NUM_IO_THREADS: 16
```

### `socket.send.buffer.bytes` & `socket.receive.buffer.bytes`
**What it does**: Network socket buffer sizes
**Recommendation**: 
```properties
environment:
  KAFKA_SOCKET_SEND_BUFFER_BYTES: 1048576    # 1 MB
  KAFKA_SOCKET_RECEIVE_BUFFER_BYTES: 1048576  # 1 MB
```

---

## 4. Application-Level Optimizations

### A. Increase Consumer Replicas
```yaml
# docker-compose.yml
consumer:
  deploy:
    replicas: 12  # Increase from 6 (match partition count)
```
**Impact**: More parallel processing
**Rule**: At least as many consumers as partitions

### B. Reduce Simulated Work Time
```yaml
environment:
  MILLISECONDS_SIMULATED_WORK: 1  # Reduce from 5ms
```
**Impact**: Faster message processing
**Real-world**: Optimize your actual business logic

### C. Batch Processing
Consider processing messages in batches:
```java
@KafkaListener(topics = "demo-topic", 
               containerFactory = "batchFactory")
public void consumeBatch(List<ConsumerRecord<String, String>> records) {
    // Process batch of records together
    records.forEach(record -> {
        // Process each record
    });
}
```

---

## 5. Topic Configuration

### `num.partitions`
**Current**: 6 partitions (configurable via NUMBER_OF_PARTITIONS)
**Recommendation**: 
- Match consumer count for full parallelism
- 12-24 partitions for higher throughput
```yaml
environment:
  NUMBER_OF_PARTITIONS: 12  # Increase from 6
```

### `replication.factor`
**Current**: 1 (single broker)
**Production**: 3 for fault tolerance
**Demo**: Keep at 1 for simplicity

---

## 6. Performance Testing Approach

1. **Baseline**: Record current metrics with default settings
2. **Change One Setting**: Apply one optimization at a time
3. **Measure Impact**: Observe lag and throughput changes
4. **Document Results**: Keep track of what works
5. **Iterate**: Try different combinations

### Test Scenarios:
```bash
# Scenario 1: High producer rate
producerCount: 5
msBetweenMessages: 1
partitionStrategy: ROUND_ROBIN

# Scenario 2: Sustained load
producerCount: 1
msBetweenMessages: 1
partitionStrategy: ROUND_ROBIN

# Scenario 3: Hot partition problem
producerCount: 5
msBetweenMessages: 1
partitionStrategy: HOT_PARTITION
```

## 7. Common Pitfalls to Avoid

❌ **Don't**: Set max.poll.records too high without adjusting max.poll.interval.ms
✅ **Do**: Ensure processing time < max.poll.interval.ms

❌ **Don't**: Use more consumers than partitions (wastes resources)
✅ **Do**: Match consumer count to partition count

❌ **Don't**: Set fetch.min.bytes too high with low message rates
✅ **Do**: Balance between throughput and latency needs

❌ **Don't**: Compress already compressed data
✅ **Do**: Test compression benefit for your data
