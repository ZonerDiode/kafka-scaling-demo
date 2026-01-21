package com.example.producer;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Exposes endpoints for Dashboard to activate sending to topics.
 */
@RestController
@RequestMapping ("/api")
public class EventControlApi {
 
    private final EventProducer eventProducer;
    private final ApplicationConfig config;

    public EventControlApi(EventProducer eventProducer, ApplicationConfig config) {
        this.eventProducer = eventProducer;
        this.config = config;
    }
    
    @PostMapping("/run-demo-topic-single")
    public ResponseEntity<String> runDemoTopicSingle() {

        eventProducer.send(Topics.DEMO_TOPIC_SINGLE, 
            config.millisecondsBetweenMessages(), 
            EventPartitioner.Strategy.ROUND_ROBIN);
        return ResponseEntity.ok("Writing to single topic");
    }
    
    @PostMapping("/run-demo-topic")
    public ResponseEntity<String> runDemoTopic() {

        eventProducer.send(Topics.DEMO_TOPIC, 
            config.millisecondsBetweenMessages(), 
            EventPartitioner.Strategy.ROUND_ROBIN);
        return ResponseEntity.ok("Writing to distributed topic");
    }

    @PostMapping("/run-demo-topic-hot")
    public ResponseEntity<String> runDemoTopicHot() {

        eventProducer.send(Topics.DEMO_TOPIC, 
            config.millisecondsBetweenMessages(), 
            EventPartitioner.Strategy.HOT_PARTITION);
        return ResponseEntity.ok("Writing to distributed topic with hot keys");
    }
}
