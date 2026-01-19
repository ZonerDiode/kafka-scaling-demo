package com.example.producer;

import java.util.concurrent.atomic.AtomicLong;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class EventProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final AtomicLong msgCount = new AtomicLong(0);
    
    @Value("${app.kafka.topic}")
    private String topic;
    
    @Value("${app.kafka.keytype}")
    private String keytype;
    
    private static final Logger logger = LoggerFactory.getLogger(EventProducer.class);

    public EventProducer(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    @Scheduled(fixedRateString = "${app.kafka.rate}")
    public void send() {
        
        long count = msgCount.incrementAndGet();
        
        kafkaTemplate.send(
                topic, 
                generateKey(count),
                String.format("Event message from %s", RandomNameGenerator.generateName()));
        
        if (count % 10 == 0) {
            logger.info("Sent {} messages using key type {}", count, keytype);
        }
    }
    
    /**
     * Generate key based on current strategy
     * 
     * SINGLE: Always uses same key (for 1 partition scenario)
     * BAD: 80% of messages use same key, causing hot partition
     * GOOD: Evenly distributed keys across partitions
     */
    private String generateKey(long messageNum) {
        
        switch (keytype.toLowerCase()) {
            case "single":
                // All messages to same key (only works with 1 partition anyway)
                return "key-0";
                
            case "bad":
                // BAD STRATEGY: 80% of messages use same key
                // This creates a "hot partition" problem
                if (messageNum % 100 < 80) {
                    return "hot-key"; // Most messages use this key
                } else {
                    // Remaining 20% distributed among other keys
                    return "key-" + (messageNum % 3);
                }
                
            case "good":
            default:
                // GOOD STRATEGY: Round-robin distribution
                // This ensures even distribution across partitions
                return "key-" + (messageNum % 10);
        }
    }
}