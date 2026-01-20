package com.example.producer;


import org.apache.kafka.clients.admin.AdminClient;
import org.apache.kafka.clients.admin.DescribeTopicsResult;
import org.springframework.boot.health.contributor.Health;
import org.springframework.boot.health.contributor.HealthIndicator;
import org.springframework.kafka.core.KafkaAdmin;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;
import java.util.concurrent.TimeUnit;

@Component("kafkaTopics")
public class TopicHealthIndicator implements HealthIndicator {

    private final KafkaAdmin kafkaAdmin;
    private final List<String> requiredTopics = List.of(Topics.DEMO_TOPIC, Topics.DEMO_TOPIC_SINGLE);

    public TopicHealthIndicator(KafkaAdmin kafkaAdmin) {
        this.kafkaAdmin = kafkaAdmin;
    }

    @Override
    public Health health() {
        try (AdminClient adminClient = AdminClient.create(kafkaAdmin.getConfigurationProperties())) {
            
            DescribeTopicsResult result = adminClient.describeTopics(requiredTopics);
            
            // Wait briefly to see if topics are metadata-visible
            Set<String> foundTopics = result.allTopicNames().get(5, TimeUnit.SECONDS).keySet();

            if (foundTopics.containsAll(requiredTopics)) {
                return Health.up().withDetail("topics", foundTopics).build();
            } else {
                return Health.down().withDetail("missing", "Not all topics ready").build();
            }
        } catch (Exception e) {
            return Health.down(e).build();
        }
    }
}

