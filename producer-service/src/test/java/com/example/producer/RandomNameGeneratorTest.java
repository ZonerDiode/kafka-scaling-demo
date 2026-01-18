package com.example.producer;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class RandomNameGeneratorTest {

    @Test
    void generateName_shouldReturnValidName() {
        
        String name = RandomNameGenerator.generateName();

        assertNotNull(name);
        assertFalse(name.isEmpty());
    }
}