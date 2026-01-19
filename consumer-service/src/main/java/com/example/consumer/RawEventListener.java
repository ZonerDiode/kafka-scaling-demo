package com.example.consumer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class RawEventListener {

    private static final Logger logger = LoggerFactory.getLogger(RawEventListener.class);
    
    @KafkaListener(
            topics = "${app.kafka.topic}", 
            groupId = "${app.kafka.group}"
    )
    public void listen(String message) {
        
        logger.info("Received raw event: {}", message);
        
        try{
            Thread.sleep(5);
        }
        catch (InterruptedException ex) {
            logger.error("Thread was Interrupted.", ex);
            Thread.currentThread().interrupt();
        }
    }
}
