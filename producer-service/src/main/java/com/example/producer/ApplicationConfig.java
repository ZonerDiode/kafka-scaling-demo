package com.example.producer;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration properties for the producer service, loaded from environment variables or application properties.
 */
@ConfigurationProperties()
public record ApplicationConfig (
    String bootstrapServers,
    int numberOfPartitions
) {
    public ApplicationConfig {
        if (bootstrapServers == null) bootstrapServers = "localhost:9092";
        if (numberOfPartitions == 0) numberOfPartitions = 3;
    }
}
