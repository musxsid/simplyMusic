package com.simplymusic.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.simplymusic.model.ActivityLog;
import com.simplymusic.repository.ActivityLogRepository;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class EventConsumer {

    private final ActivityLogRepository repository;
    private final ObjectMapper mapper;

    public EventConsumer(ActivityLogRepository repository, ObjectMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @RabbitListener(queues = "music.events")
    public void handleEvent(String message) {
        try {
            JsonNode jsonNode = mapper.readTree(message);
            String eventType = jsonNode.get("eventType").asText();
            String trackId = jsonNode.has("trackId") ? jsonNode.get("trackId").asText() : null;
            String userId = jsonNode.has("userId") ? jsonNode.get("userId").asText() : "anonymous";
            
            ActivityLog log = ActivityLog.builder()
                    .eventType(eventType)
                    .trackId(trackId)
                    .userId(userId)
                    .timestamp(Instant.now())
                    .build();
            
            repository.save(log);
            System.out.println("Analytics processed event: " + eventType);
        } catch (Exception e) {
            System.err.println("Failed to process event: " + e.getMessage());
        }
    }
}
