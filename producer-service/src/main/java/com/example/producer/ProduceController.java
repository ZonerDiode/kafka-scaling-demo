package com.example.producer;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/produce")
public class ProduceController {

    private final EventProducer eventProducer;

    public ProduceController(EventProducer eventProducer) {
        this.eventProducer = eventProducer;
    }

    @PostMapping("/{topic}")
    public ResponseEntity<String> produce(
            @PathVariable String topic,
            @RequestBody EventRequest request
    ) {
        eventProducer.send(topic, request.key(), request.payload());
        return ResponseEntity.ok("Message sent");
    }
}