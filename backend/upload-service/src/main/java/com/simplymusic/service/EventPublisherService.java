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

    public void publishFileUploadedEvent(String trackId, String userId, String objectName, String filename, String fileHash) {
        try {
            ObjectNode event = mapper.createObjectNode();
            event.put("eventType", "FILE_UPLOADED");
            event.put("trackId", trackId);
            event.put("userId", userId);
            event.put("objectName", objectName);
            event.put("filename", filename);
            event.put("fileHash", fileHash);
            
            rabbitTemplate.convertAndSend(RabbitConfig.MUSIC_EVENTS_QUEUE, mapper.writeValueAsString(event));
        } catch (Exception e) {
            System.err.println("Failed to publish event: " + e.getMessage());
        }
    }
}
