package com.example.producer;

/**
 * Utility class to hold topic names, changes to topic names must be coordinated through dev-ops.
 */
public class Topics {

    public static final String RAW_EVENTS = "events.raw";

    private Topics() {
        throw new UnsupportedOperationException("This is a utility class and cannot be instantiated");
    }
}