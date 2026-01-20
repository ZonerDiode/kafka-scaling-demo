package com.example.producer;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class KeyGeneratorTest {

    @Test
    void testGenerateEvenKey_isCreated() {

        String key = KeyGenerator.generateKey(1, KeyGenerator.KeyType.EVEN);
        
        assertNotNull(key);
        assertFalse(key.isEmpty());
    }

    @Test
    void testGenerateHotKey_isFocused_to_partition1() {

        // Keys 0-6 map to "key-0" - 50% to partition 1
        for (int i = 0; i < 5; i++) {
            String key = KeyGenerator.generateKey(i, KeyGenerator.KeyType.HOT);
            assertEquals("key-0", key);
        }

        // Keys 5-7 map to "key-1" - 30% to partition 0
        for (int i = 5; i < 8; i++) {
            String key = KeyGenerator.generateKey(i, KeyGenerator.KeyType.HOT);
            assertEquals("key-1", key);
        }
        
        // Key 8-9 maps to "key-2" - 20% to partition 2
        for (int i = 8; i < 10; i++) {
            String key = KeyGenerator.generateKey(i, KeyGenerator.KeyType.HOT);
            assertEquals("key-2", key);
        }
    }
}