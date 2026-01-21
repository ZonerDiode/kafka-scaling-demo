package com.example.consumer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class EventListener {

    private final ApplicationConfig config;
    private static final Logger logger = LoggerFactory.getLogger(EventListener.class);
    
    public EventListener(ApplicationConfig config) {
        this.config = config;
    }

    @KafkaListener(
            topics = "${topic.name}", 
            groupId = "${consumer.group}"
    )
    public void listen(String message) {
        
        logger.info("Received event: {}", message);
        
        try{
            Thread.sleep(config.millisecondsSimulatedWork());
        }
        catch (InterruptedException ex) {
            logger.error("Thread was Interrupted.", ex);
            Thread.currentThread().interrupt();
        }
    }
}
