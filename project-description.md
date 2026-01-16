### Problem Statement
🧪 Kafka Scaling Demonstration Project
A self‑contained environment that lets you overload a topic, observe the symptoms, and apply each scaling tactic one by one.

🏗️ 1. Core Architecture of the Test Project
Components
• 	Kafka cluster (3 brokers) using Docker Compose
• 	Producer service (Java Spring Boot or Python—your choice)
• 	Consumer service (Java Spring Boot)
• 	Monitoring stack
• 	Kafka UI (e.g., Kafka UI or Kafdrop)
• 	Prometheus + Grafana (optional but powerful)
Why this setup
• 	3 brokers let you demonstrate partition distribution, rebalancing, and broker saturation.
• 	Separate producer/consumer services let you simulate real throughput pressure.
• 	Monitoring gives you visibility into lag, broker load, and partition distribution.

🔥 2. The Scenario You’ll Simulate
You create a topic called events.raw with:
• 	1 partition
• 	Replication factor 1
• 	Retention 24 hours
Then you:
1. 	Overload the topic by sending a high volume of messages.
2. 	Watch consumer lag explode.
3. 	Apply scaling tactics one by one and observe the impact.
This gives you a clean before/after for each technique.

🧩 3. Scaling Tactics You Can Demonstrate
Below is a concrete mapping of what you do and what you observe.

Tactic 1 — Increase partitions
• 	Start with 1 partition
• 	Increase to 6
• 	Add more consumers to the consumer group
What you’ll see:
• 	Lag drops dramatically
• 	Throughput increases
• 	Ordering becomes per‑partition

Tactic 2 — Add more consumers
• 	Start with 1 consumer
• 	Scale to 6 consumers
What you’ll see:
• 	Each consumer gets fewer partitions
• 	Processing time per message drops
• 	Lag stabilizes

Tactic 3 — Add more brokers
• 	Start with 3 brokers
• 	Add a 4th broker
• 	Reassign partitions
What you’ll see:
• 	Broker CPU/network load evens out
• 	Replication becomes faster
• 	Partition distribution improves

Tactic 4 — Tune producer throughput
Modify producer settings:
• 	batch.size
• 	linger.ms
• 	compression.type=zstd
• 	acks=1 vs acks=all
What you’ll see:
• 	Fewer requests per second
• 	Lower broker load
• 	Higher sustained throughput

Tactic 5 — Tune topic/broker configs
Try:
• 	Increasing 
• 	Changing retention
• 	Adjusting replication factor
What you’ll see:
• 	Less segment churn
• 	More stable broker I/O
• 	Faster replication

Tactic 6 — Split the topic
Create:
• 	events.raw
• 	events.high_priority
• 	events.low_priority
What you’ll see:
• 	Consumers can scale independently
• 	High‑priority traffic is isolated

Tactic 7 — Add Kafka Streams pre‑aggregation
Create a small Streams app that:
• 	Reads events.raw
• 	Aggregates counts
• 	Writes to events.aggregates
What you’ll see:
• 	Downstream consumers process far fewer messages
• 	Lag disappears even without scaling consumers

🧪 5. Load Generator (the key to the whole demo)
A simple Python script or Java CLI that:
- Sends 50k–200k messages/minute
- Lets you adjust:
- message size
- send rate
- key distribution (to show partition skew)
This is what creates the overload conditions.

🎯 6. What You’ll Be Able to Demonstrate

Scaling tactic		|		Visible effect
More partitions		|		Parallelism increases
More consumers		|		Lag drops
More brokers		|		Load spreads out
Producer tuning		|		Broker pressure decreases
Topic tuning		|		Disk I/O stabilizes
Topic splitting		|		Traffic isolation
Streams aggregation	|		Downstream load reduction

This gives you a complete, end‑to‑end story of how Kafka scales.

If you want, I can generate:
- A full docker-compose.yml for the 3‑broker cluster
- A Spring Boot producer template
- A Spring Boot consumer template
- A load generator script
- A step‑by‑step walkthrough of each scaling experiment
Just tell me which pieces you want to build first


### Project Architecture
This is a Kafka scaling demonstration project that has a Java producer service that populates a Kafka topic and uses
a Java consumer service to read the event messages.

## Directory Structure
kafka-scaling-demo/
  docker/
    docker-compose.yml
    kafka/
    prometheus/
    grafana/
  producer-service/
    src/main/java/com/example/producer
  consumer-service/
    src/main/java/com/example/consumer
  streams-service/
    src/main/java/...
  load-generator/
    python/ or java/
  dashboards/
    grafana/
  docs/
    scaling-scenarios.md
    observations.md