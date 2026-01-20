package com.example.producer;

import java.time.Duration;
import java.util.Optional;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.atomic.AtomicLong;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Service;

@Service
public class EventProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final TaskScheduler taskScheduler;
    private final AtomicLong msgCount = new AtomicLong(0);
    private ScheduledFuture<?> currentTask;
    
    private static final Logger logger = LoggerFactory.getLogger(EventProducer.class);

    public EventProducer(KafkaTemplate<String, String> kafkaTemplate, TaskScheduler taskScheduler) {
        this.kafkaTemplate = kafkaTemplate;
        this.taskScheduler = taskScheduler;
    }

    /**
    * Send events to a Kafka topic at a set rate using the specified {@link KeyGenerator.KeyType} 
    * until {@link EventProducer#stop()} is called.
    * 
     * @param topic The topic destination.
     * @param msRate Send every MilliSeconds.
     * @param keyType The key type to create.
    */
    public void send(String topic, long msRate, KeyGenerator.KeyType keyType) {
        
        stop();
        
        currentTask = taskScheduler.scheduleAtFixedRate(() -> 
        {
            long count = msgCount.incrementAndGet();
            
            kafkaTemplate.send(
                    topic, 
                    KeyGenerator.generateKey(count, keyType),
                    String.format("Event message from %s", RandomNameGenerator.generateName()));
            
            if (count % 500 == 0) {
                logger.info("Sent {} messages using key type {}", count, keyType);
            }

        }, Duration.ofMillis(msRate));
    }
    
    /**
     * Stop sending events, if currently sending events.
     */
    public void stop() {
        
        Optional.ofNullable(currentTask)
                .ifPresent((t)-> t.cancel(true));
    }
}