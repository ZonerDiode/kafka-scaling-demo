package com.example.producer;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration properties for the producer service, loaded from environment variables or application properties.
 */
@ConfigurationProperties()
public record ApplicationConfig (
    String bootstrapServers,
    int millisecondsBetweenMessages,
    int numberOfPartitions
 ) {}
