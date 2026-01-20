package com.example.consumer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class EventListener {

    private static final Logger logger = LoggerFactory.getLogger(EventListener.class);
    
    @KafkaListener(
            topics = "${app.kafka.topic}", 
            groupId = "${app.kafka.group}"
    )
    public void listen(String message) {
        
        logger.info("Received event: {}", message);
        
        try{
            Thread.sleep(10);
        }
        catch (InterruptedException ex) {
            logger.error("Thread was Interrupted.", ex);
            Thread.currentThread().interrupt();
        }
    }
}
