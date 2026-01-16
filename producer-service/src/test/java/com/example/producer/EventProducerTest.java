package com.example.producer;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;

import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class EventProducerTest {

    @Mock
    private KafkaTemplate<String, String> kafkaTemplate;

    @InjectMocks
    private EventProducer eventProducer;

    @Test
    void send_shouldSendMessageToTopic() {
        
        // Given
        String topic = "test-topic";
        String key = "test-key";
        String payload = "test-payload";

        // When
        eventProducer.send(topic, key, payload);

        // Then
        verify(kafkaTemplate).send(topic, key, payload);
    }
}