package com.example.producer;

import java.util.UUID;

/**
 * Generates Keys based on key type.
 */
public class KeyGenerator {

    private KeyGenerator() {
        throw new IllegalStateException("This is a utility class and cannot be instantiated");
    }

    /**
     * Generate a key based on {@link KeyType}.
     * 
     * @param messageNum Message count that the key is based on.
     * @param keyType Which key strategy to use.
     * @return a generated Key
     */
    public static String generateKey(long messageNum, KeyType keyType) {
        
        return switch (keyType) {
            case EVEN -> UUID.randomUUID().toString();
            case HOT -> pickHotKey(messageNum);
        };
    }

    /**
     * Picks a hot key based on the message number, depends on there being 3 partitions.
     */
    private static String pickHotKey(long messageNum) {

        long mod = messageNum % 10;
        if (mod < 5) {
            return "key-0"; // 50% to partition 1
        } else if (mod < 8) {
            return "key-1"; // 30% to partition 0
        } else {
            return "key-2"; // 20% to partition 2
        }
    }
    
    public enum KeyType {
        EVEN,
        HOT
    }
}
