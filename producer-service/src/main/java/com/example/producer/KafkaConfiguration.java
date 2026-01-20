package com.example.producer;

import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;

import java.util.HashMap;
import java.util.Map;
import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.KafkaAdmin;


@Configuration
public class KafkaConfiguration {

    @Bean
    public ProducerFactory<String, String> producerFactory() {
        
        Map<String, Object> config = new HashMap<>();
        config.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, System.getenv().getOrDefault("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092"));
        config.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        config.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        config.put(ProducerConfig.ACKS_CONFIG, "1");
        config.put(ProducerConfig.LINGER_MS_CONFIG, 5);
        config.put(ProducerConfig.BATCH_SIZE_CONFIG, 32_768);
        config.put(ProducerConfig.COMPRESSION_TYPE_CONFIG, "zstd");

        return new DefaultKafkaProducerFactory<>(config);
    }

    @Bean
    public KafkaTemplate<String, String> kafkaTemplate(ProducerFactory<String, String> producerFactory) {
        return new KafkaTemplate<>(producerFactory);
    }
    
    @Bean
    public KafkaAdmin kafkaAdmin() {
        
        Map<String, Object> config = new HashMap<>();
        config.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, System.getenv().getOrDefault("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092"));
        return new KafkaAdmin(config);
    }
    
    @Bean
    public NewTopic demoTopic() {
        return TopicBuilder.name(Topics.DEMO_TOPIC)
                .partitions(3)
                .config("retention.ms", "10000")
                .build();
    }
    
    @Bean
    public NewTopic demoTopicSingle() {
        return TopicBuilder.name(Topics.DEMO_TOPIC_SINGLE)
                .partitions(1)
                .config("retention.ms", "10000")
                .build();
    }
}