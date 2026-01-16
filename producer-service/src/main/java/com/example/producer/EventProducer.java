package com.example.producer;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class EventProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;
    
    public EventProducer(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void send(String topic, String key, String payload) {
        kafkaTemplate.send(topic, key, payload);
    }
}