package com.example.consumer;

import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;

import java.util.HashMap;
import java.util.Map;
import org.apache.kafka.clients.consumer.NoOffsetForPartitionException;
import org.apache.kafka.clients.consumer.OffsetOutOfRangeException;
import org.apache.kafka.common.errors.UnknownTopicOrPartitionException;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.kafka.listener.SeekUtils;

@Configuration
public class KafkaConsumerConfig {

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, String> kafkaListenerContainerFactory() {
        
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, System.getenv().getOrDefault("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092"));
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "demo-consumer");
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, "true");
        props.put(ConsumerConfig.AUTO_COMMIT_INTERVAL_MS_CONFIG, "1000");
        props.put(ConsumerConfig.METADATA_MAX_AGE_CONFIG, "2000");

        DefaultKafkaConsumerFactory<String, String> consumerFactory =
                new DefaultKafkaConsumerFactory<>(props);

        ConcurrentKafkaListenerContainerFactory<String, String> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory);
        
        // Custom recoverer - Get the consumer to exit so that Docker restart kicks in and rejoins topic.
        // The partitions are set to 1 with 4 consumers hanging out, so 3 just sit around until the topic
        // is deleted and rebuilt with 4 partitions. This crude restart allows the demo to run without 
        // a bunch of docker scale commands needed from the user.
        DefaultErrorHandler errorHandler = new DefaultErrorHandler(
                
                (record, exception) -> {
                    System.err.println("Fatal Kafka error detected, exiting JVM...");
                    System.exit(1);
                },
                SeekUtils.DEFAULT_BACK_OFF
        );

        // Mark these as fatal (no retry → triggers recoverer → triggers System.exit)
        errorHandler.addNotRetryableExceptions(
                UnknownTopicOrPartitionException.class,
                OffsetOutOfRangeException.class,
                NoOffsetForPartitionException.class
        );

        factory.setCommonErrorHandler(errorHandler);

        // Optional but recommended
        factory.getContainerProperties().setMissingTopicsFatal(true);

        return factory;
    }
}