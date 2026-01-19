// server.js - Node.js backend for Kafka demo control
const express = require('express');
const WebSocket = require('ws');
const { exec } = require('child_process');
const util = require('util');
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
const TOPIC_NAME = process.env.TOPIC_NAME || 'demo-topic';
const CONSUMER_GROUP = process.env.CONSUMER_GROUP || 'demo-group';

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
async function getConsumerGroupLag() {
    const cmd = `kafka-consumer-groups --bootstrap-server ${BOOTSTRAP_SERVERS} --describe --group ${CONSUMER_GROUP}`;
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
        
        if (parts.length >= 6 && parts[1] === TOPIC_NAME) {
            const partition = parseInt(parts[2]);
            const currentOffset = parseInt(parts[3]) || 0;
            const logEndOffset = parseInt(parts[4]) || 0;
            const lag = parseInt(parts[5]) || 0;
            const consumerId = parts[6] || '-';

            // Only add if partition number is valid
            if (!isNaN(partition)) {
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

    console.log('Parsed partitions:', partitions); // Debug log

    return {
        partitions,
        totalLag,
        consumers: activeConsumers.size
    };
}

// Get topic details
async function getTopicDetails() {
    const cmd = `kafka-topics --bootstrap-server ${BOOTSTRAP_SERVERS} --describe --topic ${TOPIC_NAME}`;
    const result = await execKafkaCommand(cmd);
    
    // Topic doesn't exist yet - this is OK
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

// Create or modify topic
async function setupTopic(partitions) {
    // Try to delete existing topic
    await execKafkaCommand(
        `kafka-topics --bootstrap-server ${BOOTSTRAP_SERVERS} --delete --topic ${TOPIC_NAME}`
    );
    
    // Wait a bit for deletion
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Create new topic
    const cmd = `kafka-topics --bootstrap-server ${BOOTSTRAP_SERVERS} --create --topic ${TOPIC_NAME} --partitions ${partitions} --replication-factor 1`;
    const result = await execKafkaCommand(cmd);
    
    return result.success;
}

// Scale consumers
async function scaleConsumers(count) {
    try {
        const { stdout } = await execPromise(
            `docker-compose up -d --scale consumer=${count}`
        );
        return { success: true, output: stdout };
    } catch (error) {
        console.error('Scale error:', error);
        return { success: false, error: error.message };
    }
}

// Send stage configuration to producer
async function configureProducer(stage) {
    // Send signal to producer container via environment variable update and restart
    const envVars = {
        1: { KEY_STRATEGY: 'single', MESSAGE_RATE: '10' },
        2: { KEY_STRATEGY: 'bad', MESSAGE_RATE: '5' },
        3: { KEY_STRATEGY: 'good', MESSAGE_RATE: '5' }
    };

    const config = envVars[stage];
    if (!config) return { success: false };

    try {
        // Update producer environment and restart
        await execPromise(
            `docker-compose up -d producer --force-recreate --no-deps`
        );
        
        // Set environment variables via docker exec
        for (const [key, value] of Object.entries(config)) {
            await execPromise(
                `docker exec producer sh -c "export ${key}=${value}"`
            );
        }
        
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Activate stage
async function activateStage(stageNum) {
    console.log(`Activating stage ${stageNum}...`);
    currentStage = stageNum;

    const stageConfigs = {
        1: { partitions: 1, consumers: 1, keyStrategy: 'single' },
        2: { partitions: 4, consumers: 4, keyStrategy: 'bad' },
        3: { partitions: 4, consumers: 4, keyStrategy: 'good' }
    };

    const config = stageConfigs[stageNum];
    if (!config) {
        return { success: false, error: 'Invalid stage' };
    }

    try {
        // Setup topic with correct partitions
        console.log(`Setting up topic with ${config.partitions} partitions...`);
        await setupTopic(config.partitions);

        // Wait for topic to be ready
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Scale consumers
        console.log(`Scaling to ${config.consumers} consumers...`);
        await scaleConsumers(config.consumers);

        // Configure producer
        console.log(`Configuring producer with ${config.keyStrategy} strategy...`);
        await configureProducer(stageNum);

        // Wait for everything to stabilize
        await new Promise(resolve => setTimeout(resolve, 2000));

        broadcastToClients({
            type: 'stage-activated',
            stage: stageNum,
            config
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
    try {
        const [lagData, topicData] = await Promise.all([
            getConsumerGroupLag(),
            getTopicDetails()
        ]);

        // Only log when topic exists
        if (topicData.exists && lagData.partitions.length > 0) {
            console.log('Metrics collected:', {
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
    const stageNum = parseInt(req.params.stageNum);
    const result = await activateStage(stageNum);
    res.json(result);
});

app.get('/api/metrics', async (req, res) => {
    const metrics = await collectMetrics();
    res.json(metrics);
});

app.get('/api/status', async (req, res) => {
    const [lagData, topicData] = await Promise.all([
        getConsumerGroupLag(),
        getTopicDetails()
    ]);

    res.json({
        currentStage,
        partitionCount: topicData.partitionCount,
        consumerCount: lagData.consumers,
        totalLag: lagData.totalLag
    });
});

app.get('/api/debug/consumer-group', async (req, res) => {
    const cmd = `kafka-consumer-groups --bootstrap-server ${BOOTSTRAP_SERVERS} --describe --group ${CONSUMER_GROUP}`;
    const result = await execKafkaCommand(cmd);
    res.json({
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
        ws.send(JSON.stringify(metrics));
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
    }, 2000); // Collect every 2 seconds
}

// HTTP server upgrade for WebSocket
const server = app.listen(port, () => {
    console.log(`Kafka Demo Backend running on port ${port}`);
    console.log(`WebSocket server ready`);
    startMetricsCollection();
});

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