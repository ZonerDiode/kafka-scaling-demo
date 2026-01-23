package com.example.producer;

import java.util.Map;
import java.util.Random;
import java.util.concurrent.atomic.AtomicInteger;
import org.apache.kafka.clients.producer.Partitioner;
import org.apache.kafka.common.Cluster;

/**
 * Custom partition selector for demonstrating key techniques.
 */
public class EventPartitioner implements Partitioner {

    private static volatile Strategy mode = Strategy.ROUND_ROBIN;

    public enum Strategy {
        HOT_PARTITION,
        ROUND_ROBIN
    }

    private final AtomicInteger rrCounter = new AtomicInteger(0);
    private static final Random rnd = new Random();

    /**
     * Selects the partition strategy when sending events.
     * 
     * @param newMode The mode to use for next session.
     */
    public static void setMode(Strategy newMode) {
        mode = newMode;
    }

    @Override
    public int partition(String topic,
                         Object key,
                         byte[] keyBytes,
                         Object value,
                         byte[] valueBytes,
                         Cluster cluster) {

        int numPartitions = cluster.partitionCountForTopic(topic);

        return switch (mode) {

            case HOT_PARTITION -> {
                int randomInt = rnd.nextInt(10);
                if (randomInt == 1) {
                    yield 0; // 10% → to hot partition
                }
                // Rest to normal distribution
                yield rrCounter.getAndIncrement() % numPartitions;
            }

            case ROUND_ROBIN -> rrCounter.getAndIncrement() % numPartitions;
        };
    }

    @Override public void close() {
        // No close actions
    }
    @Override public void configure(Map<String, ?> configs) {
        // No configure actions
    }
}


