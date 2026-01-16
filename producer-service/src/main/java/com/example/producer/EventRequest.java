package com.example.producer;

public record EventRequest(
        String key,
        String payload
) {}