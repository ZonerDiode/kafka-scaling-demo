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

let currentStage = 0;
let metricsInterval;

// Kafka configuration
const KAFKA_CONTAINER = process.env.KAFKA_CONTAINER || 'kafka';
const BOOTSTRAP_SERVERS = process.env.BOOTSTRAP_SERVERS || 'localhost:9092';
const PRODUCER_URL = process.env.PRODUCER_URL || 'http://producer:8081';

// Stage configurations
const STAGE_CONFIGS = {
    1: {
        endpoint: `${PRODUCER_URL}/api/run-demo-topic-single`,
        topicName: 'demo-topic-single',
        consumerGroup: 'demo-group-single',
        partitions: 1,
        description: 'Single partition, single key'
    },
    2: {
        endpoint: `${PRODUCER_URL}/api/run-demo-topic-hot`,
        topicName: 'demo-topic',
        consumerGroup: 'demo-group',
        partitions: 4,
        description: 'Multiple partitions, hot partition'
    },
    3: {
        endpoint: `${PRODUCER_URL}/api/run-demo-topic`,
        topicName: 'demo-topic',
        consumerGroup: 'demo-group',
        partitions: 4,
        description: 'Multiple partitions, balanced'
    }
};

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
    const groupReplace = consumerGroup + '-1';
    
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
            const consumerId = (parts[6] || '-').replace(groupReplace, '');

            if (!Number.isNaN(partition)) {
                partitions.push({
                    partition,
                    currentOffset,
                    logEndOffset,
                    lag,
                    consumerId: consumerId === '-' ? 'Unassigned' : consumerId
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

// Activate stage by calling producer endpoint
async function activateStage(stageNum) {
    console.log(`Activating stage ${stageNum}...`);
    
    const config = STAGE_CONFIGS[stageNum];
    if (!config) {
        return { success: false, error: 'Invalid stage' };
    }

    try {
        // Clear previous offset tracking for clean rate calculation
        previousOffsets = {};
        
        // Call producer endpoint to activate the stage
        console.log(`Calling producer endpoint: ${config.endpoint}`);
        const response = await fetch(config.endpoint, { 
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
        
        // Update current stage
        currentStage = stageNum;
        
        // Wait for things to stabilize
        await new Promise(resolve => setTimeout(resolve, 2000));

        broadcastToClients({
            type: 'stage-activated',
            stage: stageNum,
            config: {
                partitions: config.partitions,
                description: config.description
            }
        });

        return { success: true, stage: stageNum };
    } catch (error) {
        console.error('Stage activation error:', error);
        return { success: false, error: error.message };
    }
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
    if (currentStage === 0) {
        return null;
    }

    const config = STAGE_CONFIGS[currentStage];
    if (!config) {
        return null;
    }

    try {
        const [lagData, topicData] = await Promise.all([
            getConsumerGroupLag(config.topicName, config.consumerGroup),
            getTopicDetails(config.topicName)
        ]);

        // Only log when topic exists
        if (topicData.exists && lagData.partitions.length > 0) {
            console.log('Metrics collected:', {
                stage: currentStage,
                topic: config.topicName,
                partitions: lagData.partitions.length,
                consumers: lagData.consumers,
                totalLag: lagData.totalLag
            });
        }

        const metrics = {
            type: 'metrics',
            timestamp: Date.now(),
            stage: currentStage,
            partitionCount: topicData.partitionCount,
            consumerCount: lagData.consumers,
            totalLag: lagData.totalLag,
            partitions: lagData.partitions,
            messageRate: calculateMessageRate(lagData.partitions)
        };

        broadcastToClients(metrics);
        return metrics;
    } catch (error) {
        console.error('Error collecting metrics:', error);
        return null;
    }
}

// Calculate message rate based on offset changes
let previousOffsets = {};
function calculateMessageRate(partitions) {
    const currentTime = Date.now();
    let totalRate = 0;

    partitions.forEach(p => {
        const key = `p${p.partition}`;
        const previous = previousOffsets[key];
        
        if (previous) {
            const offsetDiff = p.logEndOffset - previous.offset;
            const timeDiff = (currentTime - previous.time) / 1000; // seconds
            const rate = timeDiff > 0 ? offsetDiff / timeDiff : 0;
            totalRate += rate;
        }

        previousOffsets[key] = {
            offset: p.logEndOffset,
            time: currentTime
        };
    });

    return Math.round(totalRate);
}

// REST API endpoints
app.post('/api/stage/:stageNum', async (req, res) => {
    const stageNum = Number.parseInt(req.params.stageNum);
    const result = await activateStage(stageNum);
    res.json(result);
});

app.get('/api/metrics', async (req, res) => {
    const metrics = await collectMetrics();
    res.json(metrics);
});

app.get('/api/status', async (req, res) => {
    if (currentStage === 0) {
        return res.json({
            currentStage: 0,
            partitionCount: 0,
            consumerCount: 0,
            totalLag: 0
        });
    }

    const config = STAGE_CONFIGS[currentStage];
    const [lagData, topicData] = await Promise.all([
        getConsumerGroupLag(config.topicName, config.consumerGroup),
        getTopicDetails(config.topicName)
    ]);

    res.json({
        currentStage,
        partitionCount: topicData.partitionCount,
        consumerCount: lagData.consumers,
        totalLag: lagData.totalLag
    });
});

app.get('/api/debug/consumer-group/:stage?', async (req, res) => {
    const stage = req.params.stage ? Number.parseInt(req.params.stage) : currentStage;
    const config = STAGE_CONFIGS[stage];
    
    if (!config) {
        return res.json({ error: 'Invalid stage' });
    }

    const cmd = `kafka-consumer-groups --bootstrap-server ${BOOTSTRAP_SERVERS} --describe --group ${config.consumerGroup}`;
    const result = await execKafkaCommand(cmd);
    
    res.json({
        stage,
        topic: config.topicName,
        consumerGroup: config.consumerGroup,
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
    }, 400); // Collect every 400 milliseconds
}

// HTTP server upgrade for WebSocket
const server = app.listen(port, () => {
    console.log(`Kafka Demo Backend running on port ${port}`);
    console.log(`WebSocket server ready`);
    console.log(`Stage configurations:`, STAGE_CONFIGS);
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