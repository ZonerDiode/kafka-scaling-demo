package com.example.producer;

import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest; 
import org.springframework.test.context.bean.override.mockito.MockitoBean; 
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ProduceController.class)
class ProduceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean 
    private EventProducer eventProducer;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void produce_shouldSendMessageAndReturnOk() throws Exception {
        
        // Given
        String topic = "test-topic";
        EventRequest request = new EventRequest("test-key", "test-payload");
        String requestJson = objectMapper.writeValueAsString(request);

        // When & Then
        mockMvc.perform(post("/produce/{topic}", topic)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isOk())
                .andExpect(content().string("Message sent"));

        verify(eventProducer).send(topic, "test-key", "test-payload");
    }
}