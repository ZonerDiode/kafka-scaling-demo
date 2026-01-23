package com.example.producer;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Exposes endpoints for Dashboard to activate sending to topics.
 */
@RestController
@RequestMapping ("/api")
public class EventControlApi {
 
    private final EventProducer eventProducer;

    public EventControlApi(EventProducer eventProducer, ApplicationConfig config) {
        this.eventProducer = eventProducer;
    }
    
    public record ProduceMessages(
        int producerCount,
        int msBetweenMessages,
        EventPartitioner.Strategy partitionStrategy
    ){}
    
    @PostMapping("/produce-messages")
    public ResponseEntity<String> runDemoTopic(@RequestBody ProduceMessages produceMessages) {

        eventProducer.send(
                produceMessages.producerCount,
                Topics.DEMO_TOPIC, 
                produceMessages.msBetweenMessages,
                produceMessages.partitionStrategy);
        
        return ResponseEntity.ok("Message production started.");
    }

    @PostMapping("/stop-producing")
    public ResponseEntity<String> runDemoTopicHot() {

        eventProducer.stop();
        
        return ResponseEntity.ok("Message production stopped.");
    }
}
