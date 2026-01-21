package com.example.consumer;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration properties for the consumer service, loaded from environment variables or application properties.
 */
@ConfigurationProperties()
public record ApplicationConfig (
    String bootstrapServers,
    String topicName,
    String consumerGroup,
    int millisecondsSimulatedWork
 ) {}