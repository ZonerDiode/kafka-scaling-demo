package com.example.consumer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class RawEventListener {

    private static final Logger logger = LoggerFactory.getLogger(RawEventListener.class);
    
    @KafkaListener(topics = "events.raw", groupId = "raw-events-consumer")
    public void listen(String message) {
        
        logger.info("Received raw event: {}", message);
        
    }
}
