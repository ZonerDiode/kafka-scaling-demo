// server.js - Node.js backend for Kafka demo control
const express = require('express');
const WebSocket = require('ws');
const { exec } = require('node:child_process');
const util = require('node:util');
const execPromise = util.promisify(exec);

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public'));

// WebSocket server
const wss = new WebSocket.Server({ noServer: true });

let metricsInterval;

// Kafka configuration
const KAFKA_CONTAINER = process.env.KAFKA_CONTAINER || 'kafka';
const BOOTSTRAP_SERVERS = process.env.BOOTSTRAP_SERVERS || 'localhost:9092';
const PRODUCER_URL = process.env.PRODUCER_URL || 'http://producer:8081';

// Fixed topic and consumer group
const TOPIC_NAME = 'demo-topic';
const CONSUMER_GROUP = 'demo-group';

// Execute Kafka commands
async function execKafkaCommand(command) {
    try {
        const { stdout, stderr } = await execPromise(
            `docker exec ${KAFKA_CONTAINER} ${command}`
        );
        return { success: true, output: stdout, error: stderr };
    } catch (error) {
        console.error('Kafka command error:', error);
        return { success: false, error: error.message };
    }
}

// Get consumer group lag
async function getConsumerGroupLag(topicName, consumerGroup) {
    const cmd = `kafka-consumer-groups --bootstrap-server ${BOOTSTRAP_SERVERS} --describe --group ${consumerGroup}`;
    const result = await execKafkaCommand(cmd);
    
    if (!result.success || !result.output) {
        return { partitions: [], totalLag: 0, consumers: 0 };
    }

    const lines = result.output.split('\n');
    const partitions = [];
    let totalLag = 0;
    const activeConsumers = new Set();

    lines.forEach(line => {
        // Skip header, empty lines, and error messages
        if (!line.trim() || 
            line.includes('GROUP') || 
            line.includes('TOPIC') ||
            line.includes('Consumer group') ||
            line.includes('does not exist')) {
            return;
        }

        // Split by whitespace and filter empty strings
        const parts = line.trim().split(/\s+/).filter(p => p);
        
        // Expected format: GROUP TOPIC PARTITION CURRENT-OFFSET LOG-END-OFFSET LAG CONSUMER-ID HOST CLIENT-ID
        // Index:            0     1     2         3              4              5   6           7    8
        if (parts.length >= 6 && parts[1] === topicName) {
            const partition = Number.parseInt(parts[2]);
            const currentOffset = Number.parseInt(parts[3]) || 0;
            const logEndOffset = Number.parseInt(parts[4]) || 0;
            const lag = Number.parseInt(parts[5]) || 0;
            const consumerId = parts[6] || '-';

            if (!Number.isNaN(partition)) {
                partitions.push({
                    partition,
                    currentOffset,
                    logEndOffset,
                    lag,
                    consumerId: consumerId === '-' ? 'Unassigned' : consumerId.replace(consumerGroup + '-1-', '')
                });

                totalLag += lag;
                if (consumerId !== '-') {
                    activeConsumers.add(consumerId);
                }
            }
        }
    });

    // Sort by partition number
    partitions.sort((a, b) => a.partition - b.partition);

    return {
        partitions,
        totalLag,
        consumers: activeConsumers.size
    };
}

// Get topic details
async function getTopicDetails(topicName) {
    const cmd = `kafka-topics --bootstrap-server ${BOOTSTRAP_SERVERS} --describe --topic ${topicName}`;
    const result = await execKafkaCommand(cmd);
    
    if (!result.success || result.output.includes('does not exist')) {
        return { partitionCount: 0, exists: false };
    }

    const lines = result.output.split('\n');
    const partitionLines = lines.filter(line => line.includes('Partition:'));
    
    return {
        partitionCount: partitionLines.length,
        exists: true
    };
}

// Broadcast to all WebSocket clients
function broadcastToClients(data) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// Collect and broadcast metrics
async function collectMetrics() {
    try {
        const [lagData, topicData] = await Promise.all([
            getConsumerGroupLag(TOPIC_NAME, CONSUMER_GROUP),
            getTopicDetails(TOPIC_NAME)
        ]);

        // Only log when topic exists
        if (topicData.exists && lagData.partitions.length > 0) {
            console.log('Metrics collected:', {
                topic: TOPIC_NAME,
                partitions: lagData.partitions.length,
                consumers: lagData.consumers,
                totalLag: lagData.totalLag
            });
        }

        const rates = calculateMessageRates(lagData.partitions);
        
        const metrics = {
            type: 'metrics',
            timestamp: Date.now(),
            partitionCount: topicData.partitionCount,
            consumerCount: lagData.consumers,
            totalLag: lagData.totalLag,
            partitions: lagData.partitions,
            producerRate: rates.producerRate,
            consumerRate: rates.consumerRate
        };

        broadcastToClients(metrics);
        return metrics;
    } catch (error) {
        console.error('Error collecting metrics:', error);
        return null;
    }
}

// Calculate message rates based on offset changes with smoothing
let previousOffsets = {};
let rateHistory = { producer: [], consumer: [] };
const RATE_HISTORY_SIZE = 5; // Number of samples to average

function calculateMessageRates(partitions) {
    const currentTime = Date.now();
    let totalProducerRate = 0;
    let totalConsumerRate = 0;

    partitions.forEach(p => {
        const key = `p${p.partition}`;
        const previous = previousOffsets[key];
        
        if (previous) {
            const timeDiff = (currentTime - previous.time) / 1000; // seconds
            
            if (timeDiff > 0) {
                // Producer rate: change in log-end-offset (total messages produced)
                const producedDiff = p.logEndOffset - previous.logEndOffset;
                const producerRate = producedDiff / timeDiff;
                totalProducerRate += producerRate;
                
                // Consumer rate: change in current-offset (messages consumed)
                const consumedDiff = p.currentOffset - previous.currentOffset;
                const consumerRate = consumedDiff / timeDiff;
                totalConsumerRate += consumerRate;
            }
        }

        previousOffsets[key] = {
            logEndOffset: p.logEndOffset,
            currentOffset: p.currentOffset,
            time: currentTime
        };
    });

    // Add to history for smoothing
    rateHistory.producer.push(totalProducerRate);
    rateHistory.consumer.push(totalConsumerRate);
    
    // Keep only last N samples
    if (rateHistory.producer.length > RATE_HISTORY_SIZE) {
        rateHistory.producer.shift();
    }
    if (rateHistory.consumer.length > RATE_HISTORY_SIZE) {
        rateHistory.consumer.shift();
    }
    
    // Calculate moving average
    const avgProducerRate = rateHistory.producer.reduce((a, b) => a + b, 0) / rateHistory.producer.length;
    const avgConsumerRate = rateHistory.consumer.reduce((a, b) => a + b, 0) / rateHistory.consumer.length;

    return {
        producerRate: Math.round(avgProducerRate),
        consumerRate: Math.round(avgConsumerRate)
    };
}

// REST API endpoints
app.post('/api/start-producer', async (req, res) => {
    try {
        console.log('Starting producer with config:', req.body);
        
        // Clear previous offset tracking and rate history for clean rate calculation
        previousOffsets = {};
        rateHistory = { producer: [], consumer: [] };
        
        // Forward the request to the producer service
        const response = await fetch(`${PRODUCER_URL}/api/produce-messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });
        
        if (!response.ok) {
            throw new Error(`Producer endpoint returned ${response.status}`);
        }
        
        const result = await response.text();
        console.log(`Producer response: ${result}`);
        
        res.json({ success: true, message: result });
    } catch (error) {
        console.error('Error starting producer:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/stop-producer', async (req, res) => {
    try {
        console.log('Stopping producer');
        
        // Forward the request to the producer service
        const response = await fetch(`${PRODUCER_URL}/api/stop-producing`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Producer endpoint returned ${response.status}`);
        }
        
        const result = await response.text();
        console.log(`Producer response: ${result}`);
        
        res.json({ success: true, message: result });
    } catch (error) {
        console.error('Error stopping producer:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/metrics', async (req, res) => {
    const metrics = await collectMetrics();
    res.json(metrics);
});

app.get('/api/status', async (req, res) => {
    const [lagData, topicData] = await Promise.all([
        getConsumerGroupLag(TOPIC_NAME, CONSUMER_GROUP),
        getTopicDetails(TOPIC_NAME)
    ]);

    res.json({
        partitionCount: topicData.partitionCount,
        consumerCount: lagData.consumers,
        totalLag: lagData.totalLag
    });
});

app.get('/api/debug/consumer-group', async (req, res) => {
    const cmd = `kafka-consumer-groups --bootstrap-server ${BOOTSTRAP_SERVERS} --describe --group ${CONSUMER_GROUP}`;
    const result = await execKafkaCommand(cmd);
    
    res.json({
        topic: TOPIC_NAME,
        consumerGroup: CONSUMER_GROUP,
        success: result.success,
        output: result.output,
        error: result.error
    });
});

// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('Client connected');

    // Send current status immediately
    collectMetrics().then(metrics => {
        if (metrics) {
            ws.send(JSON.stringify(metrics));
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// Start metrics collection
function startMetricsCollection() {
    if (metricsInterval) {
        clearInterval(metricsInterval);
    }

    metricsInterval = setInterval(() => {
        collectMetrics().catch(err => {
            console.error('Metrics collection error:', err);
        });
    }, 300); // Collect every 300 milliseconds
}

// HTTP server upgrade for WebSocket
const server = app.listen(port, () => {
    console.log(`Kafka Demo Backend running on port ${port}`);
    console.log(`WebSocket server ready`);
    console.log(`Monitoring topic: ${TOPIC_NAME}`);
    console.log(`Monitoring consumer group: ${CONSUMER_GROUP}`);
    startMetricsCollection();
});

// Disable HTTP timeouts to prevent WebSocket connections from being closed after 60 seconds
// This is necessary for Node.js 18+ which introduced default timeouts
server.headersTimeout = 0;
server.requestTimeout = 0;

server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Shutting down...');
    if (metricsInterval) {
        clearInterval(metricsInterval);
    }
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
