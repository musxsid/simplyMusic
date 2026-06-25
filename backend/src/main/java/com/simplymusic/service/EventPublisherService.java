package com.simplymusic.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.simplymusic.config.RabbitConfig;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Service
public class EventPublisherService {

    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper mapper;

    public EventPublisherService(RabbitTemplate rabbitTemplate, ObjectMapper mapper) {
        this.rabbitTemplate = rabbitTemplate;
        this.mapper = mapper;
    }

    public void publishEvent(String eventType, String trackId, String userId) {
        try {
            ObjectNode event = mapper.createObjectNode();
            event.put("eventType", eventType);
            if (trackId != null) event.put("trackId", trackId);
            if (userId != null) event.put("userId", userId);
            
            rabbitTemplate.convertAndSend(RabbitConfig.MUSIC_EVENTS_QUEUE, mapper.writeValueAsString(event));
        } catch (Exception e) {
            System.err.println("Failed to publish event: " + e.getMessage());
        }
    }
}
