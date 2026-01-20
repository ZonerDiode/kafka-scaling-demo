package com.example.producer;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Exposes an endpoint for Dashboard to change key selection mode.
 */
@RestController
public class ConfigChangeRest {
 
    private final EventProducer eventProducer;

    public ConfigChangeRest(EventProducer eventProducer) {
        this.eventProducer = eventProducer;
    }
    
    @PostMapping("change-key-strategy/{strategy}")
    public ResponseEntity<String> produce(@PathVariable String strategy) {
        
        eventProducer.changeKeyStrategy(strategy);
        
        return ResponseEntity.ok("Configuration changed");
    }
}
