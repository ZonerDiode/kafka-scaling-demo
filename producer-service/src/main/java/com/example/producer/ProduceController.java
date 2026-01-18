package com.example.producer;

import java.util.UUID;
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

    @PostMapping("/batch-events-raw/{batchSize}")
    public ResponseEntity<String> produceEventsRawBatch(
            @PathVariable Integer batchSize
    ) {
        for (int msgNumber = 0; msgNumber < batchSize; msgNumber++) {
            eventProducer.send(
                Topics.RAW_EVENTS, 
                UUID.randomUUID().toString(),
                String.format("%d : %s", msgNumber, RandomNameGenerator.generateName()));
        }

        return ResponseEntity.ok("Messages sent");
    }
}